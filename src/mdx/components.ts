/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { isBlock, ratio } from "@minitype/minitype";
import {
  Addkern,
  Addvspace,
  Autoref,
  B,
  BackgroundImage,
  Box,
  Br,
  Caption,
  Cid,
  ClearPage,
  Code,
  Color,
  Command,
  Dd,
  Del,
  Description,
  Dt,
  Easytable,
  Ellipse,
  Fbr,
  Figure,
  Float,
  Fn,
  FontSize,
  Footnote,
  H1,
  H2,
  H3,
  H4,
  Hbox,
  HeadingInPage,
  Image,
  IndentHere,
  InlineGraphic,
  InlineMath,
  Kenten,
  Kern,
  Li1,
  Li2,
  Li3,
  ListOf,
  ListOfCodes,
  ListOfEquations,
  ListOfImages,
  ListOfIndex,
  ListOfTables,
  Marker,
  MathBlock,
  MdFile,
  MdInline,
  MdString,
  Move,
  NewColumn,
  NewPage,
  NoBreak,
  NoBreakSpace,
  NoSplit,
  Num,
  Ol1,
  Ol2,
  Ol3,
  Overline,
  P,
  Page,
  Pageref,
  Rect,
  Ref,
  ResetLabel,
  Ruby,
  Scale,
  Section,
  Si,
  StaticBibliography,
  StaticBibliographyFile,
  Sub,
  Sup,
  Tcy,
  Td,
  Toc,
  TocIndex,
  TotalPages,
  Tr,
  U,
  Url,
  Vspace,
  Wbr,
} from "../index.js";
import { collectInlineSegments } from "../jsx/children.js";
import type {
  BlockChildren,
  EasyRowChildren,
  EasytableChildren,
  InlineChildren,
  JsxElement,
} from "../jsx/jsx-runtime.js";
import { normalizeMdxSoftBreaks } from "./softbreak.js";

// ------
// 型定義
// ------

/**
 * {@link mdxLi} が返す，リスト項目のタグ付きラッパー型．
 * {@link mdxUl}，{@link mdxOl} がこの型を識別して {@link Li1}，{@link Ol1} に変換する．
 */
type MdxLiWrapper = { readonly _type: "mdxLi"; children: InlineChildren };

/**
 * {@link mdxUl}，{@link mdxOl} が返す，リストアイテム列のタグ付きラッパー型．
 * {@link resolveListBlocks} がこの型を識別して `gapRole="list"` の {@link Box} に変換する．
 */
export type ListBlock = {
  readonly _type: "listBlock";
  items: minitype.Block[];
};

/**
 * {@link mdxCode} がブロックコンテキストで返す，コードブロックのタグ付きラッパー型．
 * {@link mdxPre} がこの型を識別して {@link Code} に変換する．
 * `pre` を上書きする場合は，{@link isMdxCode} で `children` を判定して用いる．
 */
export type MdxCodeWrapper = {
  readonly _type: "mdxCode";
  lang?: string;
  meta?: string;
  content: string;
};

// ------
// remark プラグイン
// ------

type SplitLooseListNode = {
  type?: string;
  ordered?: boolean;
  spread?: boolean;
  start?: number;
  children?: SplitLooseListNode[];
};

type PreserveCodeMetaNode = {
  type?: string;
  lang?: string | null;
  meta?: string | null;
  data?: { hProperties?: Record<string, unknown> };
  children?: unknown[];
};

/**
 * loose なリスト（項目間に空行があるもの）を，項目ごとに独立したリストに分割するプラグイン．
 * CommonMark では空行区切りで区切られたリスト群を，別々の Box として扱う．
 */
export const remarkSplitLooseList = () => {
  return (tree: { children?: SplitLooseListNode[] }) => {
    const walk = (parent: { children?: SplitLooseListNode[] }) => {
      if (!parent.children) {
        return;
      }
      const newChildren: SplitLooseListNode[] = [];
      for (const child of parent.children) {
        if (child.type === "list" && child.spread && child.children) {
          // 分割後も元のリストの番号が続くように，要素ごとに要素番号を設定
          const start = child.start ?? 1;
          for (const [index, item] of child.children.entries()) {
            walk(item);
            newChildren.push({
              type: "list",
              ordered: child.ordered,
              start: start + index,
              spread: false,
              children: [item],
            });
          }
        } else {
          walk(child);
          newChildren.push(child);
        }
      }
      parent.children = newChildren;
    };
    walk(tree);
  };
};

/**
 * コードフェンスの `meta`（info string のスペース以降の部分）を `<code>` の `data-meta` 属性として保持するプラグイン．
 * remark が MDX にコンパイルする際に meta が消えるため，hast のプロパティに移して保持する．
 * `class` 属性と異なり空白で分割されないため，空白を含む meta もそのまま渡る．
 * また，`ts:キャプション` のように `lang` がコロンを含む場合は，コロン以降を meta の先頭に移す．
 *
 * hast では `<code>` の `className` でしかコードブロックとインラインコードを区別できず，
 * `lang` のないコードブロックがインラインコードと誤認されるため，`data-code-type="block"` を付与する．
 */
export const remarkPreserveCodeMeta = () => {
  return (tree: { children?: unknown[] }) => {
    const walk = (node: PreserveCodeMetaNode) => {
      if (node.type === "code") {
        const colonIndex = node.lang?.indexOf(":") ?? -1;
        if (node.lang && colonIndex >= 0) {
          const langMeta = node.lang.slice(colonIndex + 1);
          node.lang = node.lang.slice(0, colonIndex) || null;
          node.meta = [langMeta, node.meta].filter(Boolean).join(" ");
        }
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            "data-code-type": "block",
            ...(node.meta && { "data-meta": node.meta }),
          },
        };
        node.meta = null;
      }
      if (node.children) {
        for (const child of node.children) {
          walk(child as PreserveCodeMetaNode);
        }
      }
    };
    walk(tree);
  };
};

// ------
// 型ガード
// ------

/**
 * `value` が {@link MdxLiWrapper} かどうかを判定する．
 */
const isMdxLi = (value: unknown): value is MdxLiWrapper => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { _type?: unknown })._type === "mdxLi"
  );
};

/**
 * `value` が {@link MdxCodeWrapper} かどうかを判定する．
 */
export const isMdxCode = (value: unknown): value is MdxCodeWrapper => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { _type?: unknown })._type === "mdxCode"
  );
};

/**
 * `value` の `textType` フィールドが指定した値と一致するかどうかを判定する．
 */
const hasTextType = (value: unknown, textType: string) => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { textType?: unknown }).textType === textType
  );
};

/**
 * `children` から空白のみの文字列要素を除去する．
 */
export const filterWhitespace = (children: unknown): JsxElement => {
  if (Array.isArray(children)) {
    return children.filter(
      (item) => !(typeof item === "string" && item.trim() === ""),
    ) as JsxElement[];
  }
  return children as JsxElement;
};

/**
 * `src` をパスとクエリ（`?` 以降，`?` を含む）に分割する．
 */
export const splitSrcQuery = (
  src: string,
): { pathname: string; search: string } => {
  const queryIndex = src.indexOf("?");
  return queryIndex < 0
    ? { pathname: src, search: "" }
    : { pathname: src.slice(0, queryIndex), search: src.slice(queryIndex) };
};

/**
 * `value` が {@link minitype.Footnote} かどうかを判定する．
 */
const isMdxFootnote = (value: unknown): value is minitype.Footnote => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "footnote"
  );
};

/**
 * `value` が {@link minitype.List} かどうかを判定する．
 */
const isListObj = (c: unknown): c is minitype.List =>
  typeof c === "object" &&
  c !== null &&
  (c as { type?: unknown }).type === "list";

/**
 * `value` が {@link ListBlock} かどうかを判定する．
 */
const isListBlock = (c: unknown): c is ListBlock =>
  typeof c === "object" &&
  c !== null &&
  (c as { _type?: unknown })._type === "listBlock";

/**
 * `<li>` の children から {@link ListBlock} ラッパーを展開して，フラットな配列を返す．
 *
 * @param children - `<li>` の children（インラインまたは `listBlock` の混在配列）
 * @returns インライン要素と {@link minitype.List} のフラットな配列
 */
const expandLiChildren = (
  children: InlineChildren,
): (minitype.Inline | minitype.List)[] => {
  // MDX のネストされた `<ul>`，`<ol>` は `<li>` の children に {@link ListBlock} として格納されている
  const raw = Array.isArray(children)
    ? (children as unknown[]).flat()
    : [children];
  return raw.flatMap((c) => (isListBlock(c) ? c.items : [c])) as (
    | minitype.Inline
    | minitype.List
  )[];
};

/**
 * `<li>` の children をインライン要素とネストリストに分離して，{@link makeListItem} でインライン部分をブロック化して返す．
 *
 * @param item - {@link MdxLiWrapper} または非 `<Li>` の unknown 値．
 * @param makeListItem - {@link InlineChildren} からブロックを生成する関数．
 * リストのレベルは後に上書きされるため，{@link Li1} または {@link Ol1} を渡せば良い．
 * @returns 変換後の {@link minitype.Block} の配列．
 */
const convertLiItem = (
  item: unknown,
  makeListItem: (children: InlineChildren) => minitype.Block,
): minitype.Block[] => {
  // <li> 以外（テキストノード等）はそのまま返す
  if (!isMdxLi(item)) {
    return [item as minitype.Block];
  }

  // ListBlock ラッパーを展開して，インライン要素とネストリストを分離
  const childArray = expandLiChildren(item.children);
  const inlineChildren = childArray.filter((c) => !isListObj(c));
  const nestedLists = childArray.filter(isListObj);
  const result: minitype.Block[] = [];

  // インライン部分をリストアイテムブロックに変換
  if (inlineChildren.length > 0) {
    result.push(makeListItem(inlineChildren as InlineChildren));
  }
  // ネストリストの level を 1 つ上げる（外側の <ul>/<ol> が処理されるたびに +1 される）
  for (const nested of nestedLists) {
    result.push({
      ...nested,
      level: Math.min(nested.level + 1, 3) as minitype.ListLevel,
    });
  }
  return result;
};

// ------
// コンポーネントマッピング
// ------

/**
 * `<p>` などブロック要素の inline children を行区切りを保持して取り出す．
 * MDX の "loose list" や footnote で `<li><p>text</p></li>` 構造になるケースに対応する．
 */
const extractInlineFromBlock = (children: JsxElement): JsxElement => {
  if (Array.isArray(children)) {
    return children.flatMap((child) => extractInlineFromBlock(child));
  }
  const asText = children as minitype.Text;
  if (asText?.type === "text") {
    return asText.lines.flatMap((line, index) =>
      index === 0 ? line : [Br(), ...line],
    ) as JsxElement;
  }
  return children;
};

/**
 * `<li>` 要素を {@link MdxLiWrapper} または {@link minitype.Footnote} に変換する．
 * `id` が `user-content-fn-` で始まる場合は remark-gfm の脚注リスト項目として処理する．
 */
const mdxLi = ({
  id,
  children,
}: Record<string, unknown>): MdxLiWrapper | minitype.Footnote => {
  // remark-gfm の脚注リスト項目: <li id="user-content-fn-{label}">
  if (typeof id === "string" && id.startsWith("user-content-fn-")) {
    const label = id.slice("user-content-fn-".length);
    const inlineChildren = extractInlineFromBlock(filterWhitespace(children));
    return Footnote({ label, children: inlineChildren as InlineChildren });
  }
  return {
    _type: "mdxLi",
    children: extractInlineFromBlock(
      filterWhitespace(children) as JsxElement,
    ) as InlineChildren,
  };
};

/**
 * `<ul>` 要素の各 `<li>` を {@link Li1} に変換して {@link ListBlock} ラッパーで包む．
 *
 * ネストされた `<ul>`/`<ol>`（`<li>` の children に含まれる {@link ListBlock}）は
 * {@link expandLiChildren} で展開したうえで `level` を 1 つインクリメントしてフラットに並べる．
 */
const mdxUl = ({ children }: Record<string, unknown>): ListBlock => {
  const filtered = filterWhitespace(children);
  const items = Array.isArray(filtered) ? (filtered as unknown[]) : [filtered];
  const listItems = items.flatMap((item) =>
    convertLiItem(item, (c) => Li1({ children: c })),
  );
  return { _type: "listBlock", items: listItems };
};

/**
 * `<ol>` 要素の各 `<li>` を {@link Ol1}，{@link Ol2}，または {@link Ol3} に変換して {@link ListBlock} ラッパーで包む．
 *
 * 脚注リスト（remark-gfm が生成する `<li id="user-content-fn-*">`）は
 * {@link minitype.Footnote} としてそのまま返す．
 * ネストされた `<ul>`/`<ol>` は `level` を 1 つインクリメントしてフラットに並べる．
 * `start` 属性（`3. item` のように 1 以外から始まるリスト）は，最初の要素の要素番号に設定する．
 */
const mdxOl = ({
  children,
  start,
}: Record<string, unknown>): ListBlock | minitype.Footnote[] => {
  const filtered = filterWhitespace(children);
  const items = Array.isArray(filtered) ? (filtered as unknown[]) : [filtered];
  const footnotes: minitype.Footnote[] = [];
  // MDX は `start` 属性を文字列として渡す
  const startNumber =
    typeof start === "string" && /^\d+$/.test(start)
      ? Number.parseInt(start, 10)
      : undefined;

  const listItems = items.flatMap((item, index) => {
    if (isMdxFootnote(item)) {
      footnotes.push(item);
      return [];
    }
    return convertLiItem(item, (c) =>
      Ol1({ children: c, start: index === 0 ? startNumber : undefined }),
    );
  });

  return listItems.length > 0
    ? { _type: "listBlock", items: listItems }
    : footnotes;
};

/**
 * `<code>` 要素を変換する．
 * インラインコードは {@link Command}，数式は {@link InlineMath}，
 * ブロックコードは {@link MdxCodeWrapper} を返して {@link mdxPre} に処理させる．
 */
const mdxCode = ({
  className,
  children,
  "data-code-type": dataCodeType,
  "data-meta": dataMeta,
}: Record<string, unknown>): JsxElement => {
  const childStr =
    typeof children === "string" ? children : String(children ?? "");
  // remark-math: <code class="language-math math-inline">
  if (typeof className === "string" && className.includes("math-inline")) {
    return InlineMath({ children: childStr }) as unknown as JsxElement;
  }
  const lang =
    typeof className === "string" && className.startsWith("language-")
      ? className.slice("language-".length)
      : undefined;
  // remarkPreserveCodeMeta が meta を data-meta 属性として渡す
  const meta = typeof dataMeta === "string" ? dataMeta : undefined;
  // コードブロック（remarkPreserveCodeMeta が data-code-type="block" を付与）と
  // remark-math の数式ブロック（className="language-math math-display"）は
  // MdxCodeWrapper を返して mdxPre に処理させる．
  // それ以外はインラインコードとして Command に変換する．
  if (dataCodeType !== "block" && lang === undefined) {
    return Command({ children: childStr, name: "c" });
  }
  return {
    _type: "mdxCode",
    ...(lang !== undefined && { lang }),
    ...(meta !== undefined && { meta }),
    content: childStr,
  } as unknown as JsxElement;
};

/**
 * `<pre>` 要素を {@link Code} または {@link MathBlock} に変換する．
 * 子要素が {@link MdxCodeWrapper} の場合は `lang` に応じて出力先を切り替える．
 */
const mdxPre = ({ children }: Record<string, unknown>): JsxElement => {
  if (isMdxCode(children)) {
    // remark-math: <pre><code class="language-math math-display">
    if (children.lang?.includes("math-display")) {
      return MathBlock({ children: children.content }) as unknown as JsxElement;
    }
    return Code({ children: children.content, lang: children.lang });
  }
  const content =
    typeof children === "string" ? children : String(children ?? "");
  return Code({ children: content });
};

/**
 * `<p>` 要素を {@link P} に変換する．
 * `children` がすでにブロック要素の場合はそのまま返す．
 */
const mdxP = ({ children }: Record<string, unknown>): JsxElement => {
  if (isBlock(children)) {
    return children;
  }
  return P({ children: normalizeMdxSoftBreaks(children as InlineChildren) });
};

/**
 * `<em>` 要素を `em` コマンドのインラインセグメントに変換する．
 */
const mdxEm = ({ children }: Record<string, unknown>): JsxElement => {
  return collectInlineSegments(children as InlineChildren, (inlines) => ({
    type: "command",
    body: inlines,
    name: "em",
  }));
};

/**
 * `<a>` 要素を {@link Url} または {@link Fn} に変換する．
 * remark-gfm の脚注戻りリンク（`data-footnote-backref`）は印刷物では不要なため除去する．
 * インライン脚注参照（`data-footnote-ref`）は {@link Fn} に変換する．
 */
const mdxA = ({
  href,
  id,
  children,
  "data-footnote-ref": dataFootnoteRef,
  "data-footnote-backref": dataFootnoteBackref,
}: Record<string, unknown>): JsxElement => {
  // remark-gfm の脚注戻りリンク: 印刷物では不要なので除去する
  // data-footnote-backref は "" (空文字列) で渡されるため truthy チェックではなく存在チェックをする
  if (dataFootnoteBackref !== undefined) {
    return null;
  }
  // remark-gfm のインライン脚注参照: <a id="user-content-fnref-{label}" data-footnote-ref>
  if (
    dataFootnoteRef &&
    typeof id === "string" &&
    id.startsWith("user-content-fnref-")
  ) {
    const label = id.slice("user-content-fnref-".length);
    return Fn({ label });
  }
  return Url({
    href: (href as string) ?? "",
    children: children as InlineChildren,
  });
};

/**
 * `<hr>` 要素を間隔 0 の {@link Vspace} に変換する．
 */
const mdxHr = (): minitype.Vspace => {
  return Vspace({ space: 0 });
};

/**
 * `<img>` 要素を {@link Image} または {@link Figure} に変換する．
 * `src` のクエリパラメータ `ratio` で表示幅を指定できる．
 * `alt` が指定されている場合はキャプション付きの {@link Figure} を生成する．
 */
const mdxImg = ({ src, alt }: Record<string, unknown>): JsxElement => {
  const srcStr = typeof src === "string" ? src : "";
  const { pathname: cleanSrc, search } = splitSrcQuery(srcStr);
  const params = new URLSearchParams(search);
  const parsedRatio = parseFloat(params.get("ratio") ?? "");
  const ratioValue = Number.isFinite(parsedRatio) ? parsedRatio : 1.0;
  const caption = typeof alt === "string" && alt.length > 0 ? alt : undefined;
  return caption !== undefined
    ? Figure({
        src: cleanSrc,
        style: { width: ratio(ratioValue) },
        children: caption,
      })
    : Image({
        src: cleanSrc,
        style: { width: ratio(ratioValue), align: "center" },
      });
};

/**
 * `<blockquote>` 要素を `id="blockquote"` の {@link Box} に変換する．
 */
const mdxBlockquote = ({ children }: Record<string, unknown>): JsxElement => {
  return Box({
    children: filterWhitespace(children) as BlockChildren,
    id: "blockquote",
  });
};

/**
 * `<section>` 要素をパススルーする．
 * remark-gfm v4 が脚注セクションを `<section data-footnotes>` で包む場合，
 * "Footnotes" 見出し（`h2`）を除去してから子要素を返す．
 */
const mdxSection = ({
  children,
  "data-footnotes": dataFootnotes,
}: Record<string, unknown>): JsxElement => {
  const filtered = filterWhitespace(children);
  if (dataFootnotes !== undefined && Array.isArray(filtered)) {
    // "Footnotes" 見出し (h2) を除去する
    return (filtered as unknown[]).filter(
      (child) => !hasTextType(child, "h2"),
    ) as JsxElement;
  }
  return filtered;
};

/**
 * `<td>` / `<th>` 要素を {@link Td} に変換する．
 */
const mdxTd = ({ children }: Record<string, unknown>): JsxElement => {
  return Td({ children: children as InlineChildren });
};

/**
 * `<tr>` 要素を {@link Tr} に変換する．
 */
const mdxTr = ({ children }: Record<string, unknown>): JsxElement => {
  const filtered = filterWhitespace(children);
  return Tr({ children: filtered as EasyRowChildren });
};

/**
 * `<thead>` / `<tbody>` 要素から空白を除去してパススルーする．
 */
const mdxThead = ({ children }: Record<string, unknown>): JsxElement => {
  return filterWhitespace(children);
};

/** {@link mdxThead} と同一の処理を行う `<tbody>` 用エイリアス． */
const mdxTbody = mdxThead;

/**
 * `<table>` 要素を {@link Easytable} に変換する．
 */
const mdxTable = ({ children }: Record<string, unknown>): JsxElement => {
  const filtered = filterWhitespace(children);
  return Easytable({ children: filtered as EasytableChildren });
};

/**
 * MDX のデフォルトコンポーネントマッピング．
 * HTML タグ名を minitype-tsx コンポーネントに対応させる．
 */
export const defaultComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: mdxP,
  strong: B,
  em: mdxEm,
  del: Del,
  sup: Sup,
  sub: Sub,
  code: mdxCode,
  pre: mdxPre,
  ul: mdxUl,
  ol: mdxOl,
  li: mdxLi,
  a: mdxA,
  hr: mdxHr,
  img: mdxImg,
  blockquote: mdxBlockquote,
  section: mdxSection,
  table: mdxTable,
  thead: mdxThead,
  tbody: mdxTbody,
  tr: mdxTr,
  th: mdxTd,
  td: mdxTd,
  // ページ制御
  Ruby,
  NewPage,
  ClearPage,
  NewColumn,
  // ブロック
  Vspace,
  Addvspace,
  Box,
  Float,
  Move,
  Section,
  Rect,
  Ellipse,
  Image,
  Figure,
  BackgroundImage,
  ResetLabel,
  Description,
  Dt,
  Dd,
  Toc,
  ListOf,
  ListOfImages,
  ListOfTables,
  ListOfEquations,
  ListOfCodes,
  MathBlock,
  MdString,
  MdFile,
  StaticBibliography,
  StaticBibliographyFile,
  // インライン
  U,
  Tcy,
  Overline,
  Color,
  FontSize,
  Scale,
  Command,
  InlineGraphic,
  InlineMath,
  Hbox,
  Caption,
  // インライン制御
  br: Br,
  Br,
  Fbr,
  Wbr,
  Kern,
  Addkern,
  NoBreak,
  NoBreakSpace,
  NoSplit,
  IndentHere,
  Cid,
  // 参照・ページ番号
  Ref,
  Pageref,
  Autoref,
  Page,
  TotalPages,
  Marker,
  HeadingInPage,
  TocIndex,
  ListOfIndex,
  // その他
  Kenten,
  Num,
  Si,
  MdInline,
  // リスト（ネスト）
  Li2,
  Li3,
  Ol2,
  Ol3,
  // 表（Easytable）
  Easytable,
  Tr,
  Td,
};

/**
 * ブロック配列を再帰的に走査して，{@link ListBlock} を `gapRole="list"` の {@link Box} に変換する．
 *
 * {@link mdxUl}，{@link mdxOl} は `<ul>`，`<ol>` ごとに 1 つの {@link ListBlock} を返す．
 * 空行で区切られた複数のリストブロックがそれぞれ独立した {@link Box} になることで，
 * list に対して gap を設定できるとともに，番号のリセットも `<ol>` ごとに行われるようになる．
 *
 * @param node - 走査対象のノード（ブロック，配列，または `null`）
 * @returns {@link ListBlock} を {@link Box} に置換したノード
 */
export const resolveListBlocks = (node: unknown): unknown => {
  if (node == null) {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(resolveListBlocks);
  }
  if (isListBlock(node)) {
    return Box({
      children: node.items as unknown as BlockChildren,
      style: { gapRole: "list", splitable: true },
    });
  }
  return node;
};
