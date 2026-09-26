/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { evaluate } from "@mdx-js/mdx";
import type * as minitype from "@minitype/minitype";
import { isBlock, ratio } from "@minitype/minitype";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { collectInlineSegments } from "./children.js";
import {
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
  Td,
  Toc,
  TocIndex,
  TotalPages,
  Tr,
  U,
  Url,
  Vspace,
} from "./index.js";
import type {
  BlockChildren,
  EasyRowChildren,
  EasytableChildren,
  InlineChildren,
  JsxElement,
} from "./jsx-runtime.js";
import { Fragment, jsx } from "./jsx-runtime.js";

// ------
// 型定義
// ------

/**
 * MDX コンポーネントマッピングの型．
 * デフォルトのマッピングをキーごとに上書きできる．
 */
export type MdxComponents = typeof defaultComponents;

/**
 * ユーザが `components` に追加できるコンポーネント関数の型．
 * 任意の props 型を受け付けるよう `any` を使用している．
 */
type ComponentFn = (props: any) => JsxElement;

type EvaluateOptions = Parameters<typeof evaluate>[1];

/**
 * {@link evaluateMdxString}，{@link evaluateMdxFile} のオプション．
 */
export interface EvaluateMdxOptions {
  /**
   * デフォルトの HTML タグ→コンポーネントマッピングを上書きする，
   * またはカスタムコンポーネントを追加する．
   * 指定したキーのみ置き換えられ，その他はデフォルトのままになる．
   */
  components?: Partial<{ [K in keyof MdxComponents]: ComponentFn }> &
    Record<string, ComponentFn>;
  /**
   * MDX 内の `import` 文を解決するためのベース URL．
   * 指定すると MDX ファイル内で `import { cmyk } from "@minitype/minitype"` 等が使用できる．
   * {@link evaluateMdxFile} では自動的にファイルパスから設定される．
   */
  baseUrl?: string | URL;
}

/**
 * {@link evaluateMdxString}，{@link evaluateMdxFile} の戻り値型．
 */
export interface MdxResult {
  /** 組版に使用するブロック要素の配列． */
  blocks: JsxElement;
  /** YAML フロントマターの内容． */
  frontmatter: Record<string, unknown>;
}

/**
 * {@link mdxLi} が返す，リスト項目のタグ付きラッパー型．
 * {@link mdxUl}，{@link mdxOl} がこの型を識別して {@link Li1}，{@link Ol1} に変換する．
 */
type MdxLiWrapper = { readonly _type: "mdxLi"; children: InlineChildren };

/**
 * {@link mdxCode} がブロックコンテキストで返す，コードブロックのタグ付きラッパー型．
 * {@link mdxPre} がこの型を識別して {@link Code} に変換する．
 */
type MdxCodeWrapper = {
  readonly _type: "mdxCode";
  lang?: string;
  meta?: string;
  content: string;
};

// ------
// remark プラグイン
// ------

/**
 * コードフェンスの `meta`（info string のスペース以降の部分）を `lang` に `\x01` で結合して保持するプラグイン．
 * remark が MDX にコンパイルする際に meta が消えるため，lang に埋め込んで保持する．
 */
const remarkPreserveCodeMeta = () => {
  type RemarkNode = {
    type?: string;
    lang?: string;
    meta?: string | null;
    children?: unknown[];
  };

  return (tree: { children?: unknown[] }) => {
    const walk = (node: RemarkNode) => {
      if (node.type === "code" && node.meta) {
        node.lang = `${node.lang ?? ""}\x01${node.meta}`;
        node.meta = null;
      }
      if (node.children) {
        for (const child of node.children) {
          walk(child as RemarkNode);
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
const isMdxCode = (value: unknown): value is MdxCodeWrapper => {
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
const filterWhitespace = (children: unknown): JsxElement => {
  if (Array.isArray(children)) {
    return children.filter(
      (item) => !(typeof item === "string" && item.trim() === ""),
    ) as JsxElement[];
  }
  return children as JsxElement;
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

// ------
// コンポーネントマッピング
// ------

/**
 * `<p>` などブロック要素の inline children を平坦化して取り出す．
 * MDX の "loose list" や footnote で `<li><p>text</p></li>` 構造になるケースに対応する．
 */
const extractInlineFromBlock = (children: JsxElement): JsxElement => {
  const asText = children as minitype.Text;
  if (asText?.type === "text") {
    return asText.lines.flat() as unknown as JsxElement;
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => {
      const asTextChild = child as minitype.Text;
      if (asTextChild?.type === "text") {
        return asTextChild.lines.flat();
      }
      return [child];
    }) as JsxElement;
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
 * `<ul>` 要素の各 `<li>` を {@link Li1} に変換する．
 */
const mdxUl = ({ children }: Record<string, unknown>): JsxElement => {
  const filtered = filterWhitespace(children);
  const items = Array.isArray(filtered) ? (filtered as unknown[]) : [filtered];
  return items.map((item) =>
    isMdxLi(item) ? Li1({ children: item.children }) : (item as JsxElement),
  ) as JsxElement[];
};

/**
 * `<ol>` 要素の各 `<li>` を {@link Ol1} に変換する．
 * 脚注リスト（{@link minitype.Footnote}）はそのままパススルーする．
 */
const mdxOl = ({ children }: Record<string, unknown>): JsxElement => {
  const filtered = filterWhitespace(children);
  const items = Array.isArray(filtered) ? (filtered as unknown[]) : [filtered];
  return items.map((item) => {
    if (isMdxFootnote(item)) return item as JsxElement;
    return isMdxLi(item)
      ? Ol1({ children: item.children })
      : (item as JsxElement);
  }) as JsxElement[];
};

/**
 * `<code>` 要素を変換する．
 * インラインコードは {@link Command}，数式は {@link InlineMath}，
 * ブロックコードは {@link MdxCodeWrapper} を返して {@link mdxPre} に処理させる．
 */
const mdxCode = ({
  className,
  children,
}: Record<string, unknown>): JsxElement => {
  const childStr =
    typeof children === "string" ? children : String(children ?? "");
  // remark-math: <code class="language-math math-inline">
  if (typeof className === "string" && className.includes("math-inline")) {
    return InlineMath({ children: childStr }) as unknown as JsxElement;
  }
  const rawLang =
    typeof className === "string" && className.startsWith("language-")
      ? className.slice("language-".length)
      : undefined;
  // remarkPreserveCodeMeta が meta を \x01 区切りで lang に埋め込む
  const sepIdx = rawLang?.indexOf("\x01") ?? -1;
  const lang = sepIdx >= 0 ? rawLang!.slice(0, sepIdx) : rawLang;
  const meta = sepIdx >= 0 ? rawLang!.slice(sepIdx + 1) : undefined;
  // インラインコード（className なし）は直接 Command に変換する．
  // ブロックコード（className="language-*"）は MdxCodeWrapper を返して mdxPre に処理させる．
  if (lang === undefined) {
    return Command({ children: childStr, name: "c" });
  }
  return {
    _type: "mdxCode",
    lang,
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
  return P({ children: children as InlineChildren });
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
  const qIdx = srcStr.indexOf("?");
  const cleanSrc = qIdx >= 0 ? srcStr.slice(0, qIdx) : srcStr;
  const params = new URLSearchParams(qIdx >= 0 ? srcStr.slice(qIdx + 1) : "");
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
const defaultComponents = {
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
  Br,
  Fbr,
  Kern,
  NoBreak,
  NoSplit,
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

// ------
// 公開 API
// ------

/**
 * `components` に含まれる文字列キーを参照して呼び出す JSX ファクトリを生成する．
 * MDX が raw HTML タグを文字列型（`"sup"` 等）で渡す場合に対応する．
 */
const createMdxJsx = (components: Record<string, (props: any) => unknown>) => {
  return (
    type: ((props: Record<string, unknown>) => JsxElement) | symbol | string,
    props: Record<string, unknown>,
    _key?: string,
  ): JsxElement => {
    if (typeof type === "string") {
      const component = components[type];
      if (component) {
        return component(props) as JsxElement;
      }
      throw new Error(`Unsupported JSX element type: ${type}`);
    }
    return jsx(type as Parameters<typeof jsx>[0], props, _key);
  };
};

/**
 * MDX 文字列を評価して，ブロック要素とフロントマターを返す．
 * 結果の `blocks` は `<Group>` などのブロックコンテキストで使用できる．
 */
export const evaluateMdxString = async (
  content: string,
  options?: EvaluateMdxOptions,
): Promise<MdxResult> => {
  const components = { ...defaultComponents, ...options?.components };
  const mdxJsx = createMdxJsx(components) as unknown as EvaluateOptions["jsx"];

  const { default: Content, frontmatter } = (await evaluate(content, {
    jsx: mdxJsx,
    jsxs: mdxJsx,
    Fragment,
    development: false,
    remarkPlugins: [
      remarkPreserveCodeMeta,
      remarkGfm,
      remarkMath,
      remarkFrontmatter,
      remarkMdxFrontmatter,
    ],
    ...(options?.baseUrl !== undefined && { baseUrl: options.baseUrl }),
  } as EvaluateOptions)) as {
    default: unknown;
    frontmatter?: Record<string, unknown>;
  };

  const blocks = (
    Content as (props: { components: typeof components }) => JsxElement
  )({
    components,
  });
  return {
    blocks: filterWhitespace(blocks),
    frontmatter: frontmatter ?? {},
  };
};

/**
 * MDX ファイルを読み込み評価して，ブロック要素の配列を返す．
 * 結果は `<Group>` などのブロックコンテキストで使用できる．
 */
export const evaluateMdxFile = async (
  filePath: string,
  options?: EvaluateMdxOptions,
): Promise<MdxResult> => {
  const content = await readFile(filePath, "utf-8");
  const baseUrl = options?.baseUrl ?? pathToFileURL(filePath);
  return evaluateMdxString(content, { ...options, baseUrl });
};
