/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import type {
  BackgroundImageOptions,
  BibliographyOptions,
  BlockExtender,
  Box,
  EasyCell,
  EasyCellContent,
  Em,
  FigureStyle,
  ListOfOptions,
  ListOfOptionsCustom,
  ListOfOptionsDefault,
  LstlistingStyle,
  MarkdownMapping,
  ReferenceRecord,
  Table,
  TextStyle,
  TocOptions,
} from "@minitype/minitype";
import {
  backgroundImage,
  description,
  easytable,
  figure,
  listOf,
  listOfCodes,
  listOfEquations,
  listOfImages,
  listOfTables,
  lstinputlisting,
  lstlisting,
  mdFile,
  mdString,
  readBibtex,
  span,
  staticBibliography,
  toc,
} from "@minitype/minitype";
import {
  collectDescriptionItems,
  collectEasyCells,
  collectEasyRows,
  collectInlineLines,
  collectInlines,
} from "../children.js";
import type {
  DescBodyWrapper,
  DescriptionChildren,
  DescTermWrapper,
  EasyCellWrapper,
  EasyRowChildren,
  EasyRowWrapper,
  EasytableChildren,
  InlineChildren,
} from "../jsx-runtime.js";

// ------
// Figure
// ------

/**
 * {@link Figure} コンポーネントの Props．
 */
export interface FigureProps {
  /** 画像ファイルのパス． */
  src: string;
  /**
   * 図版スタイル．{@link FigureStyle} の `label` を除くフィールドを指定する．
   * `label` はトップレベルの `label` prop に指定する．
   */
  style?: Omit<FigureStyle, "label">;
  /** 相互参照で用いるラベル． */
  label?: string;
  /** 子要素（キャプション，インライン）． */
  children?: InlineChildren;
}

/**
 * 図版とキャプションをセットで配置する．
 * children がキャプションとして扱われる．
 */
export const Figure = ({ src, style, label, children }: FigureProps): Box => {
  const caption = collectInlines(children);
  return figure(src, caption, { ...style, label });
};

// ------
// Lstlisting
// ------

/**
 * {@link Lstlisting} コンポーネントの Props．
 */
export interface LstlistingProps {
  /** 子要素（コード文字列）． */
  children?: InlineChildren;
  /** シンタックスハイライトに使用する言語名． */
  lang?: string;
  /** タイトルバーに表示するテキスト．省略時はタイトルバーを表示しない． */
  title?: string;
  /** 表示を開始するソース上の行番号（1-based）． */
  firstLine?: number;
  /** 表示を終了するソース上の行番号（1-based，指定した行を含む）． */
  lastLine?: number;
  /** 行番号として最初に表示される番号． */
  firstDisplayNumber?: number;
  /**
   * 行番号を表示するかどうか．
   * @default true
   */
  showLineNumbers?: boolean;
  /** 相互参照で用いるラベル． */
  label?: string;
  /** スタイルオプション． */
  style?: LstlistingStyle;
}

/**
 * 行番号つきのコードブロックを生成する．
 * children がコードの内容として扱われる．
 */
export const Lstlisting = ({
  children,
  lang,
  title,
  firstLine,
  lastLine,
  firstDisplayNumber,
  showLineNumbers,
  label,
  style,
}: LstlistingProps): Box => {
  const flat = collectInlineLines(children);
  const source = flat.map((line) =>
    line.map((item) => (typeof item === "string" ? item : "")).join(""),
  );
  return lstlisting(source, {
    lang,
    title,
    firstLine,
    lastLine,
    firstDisplayNumber,
    showLineNumbers,
    label,
    style,
  });
};

/**
 * {@link LstInputlisting} コンポーネントの Props．
 */
export interface LstInputlistingProps {
  /** 読み込むファイルのパス． */
  src: string;
  /** シンタックスハイライトに使用する言語名． */
  lang?: string;
  /** タイトルバーに表示するテキスト．省略時はタイトルバーを表示しない． */
  title?: string;
  /** 表示を開始するソース上の行番号（1-based）． */
  firstLine?: number;
  /** 表示を終了するソース上の行番号（1-based，指定した行を含む）． */
  lastLine?: number;
  /** 行番号として最初に表示される番号． */
  firstDisplayNumber?: number;
  /**
   * 行番号を表示するかどうか．
   * @default true
   */
  showLineNumbers?: boolean;
  /** 相互参照で用いるラベル． */
  label?: string;
  /** スタイルオプション． */
  style?: LstlistingStyle;
}

/**
 * ファイルを読み込んで行番号つきのコードブロックを生成する BlockExtender．
 * ファイルの読み込みは minitype の組版処理時に非同期で実行される．
 */
export const LstInputlisting = ({
  src,
  lang,
  title,
  firstLine,
  lastLine,
  firstDisplayNumber,
  showLineNumbers,
  label,
  style,
}: LstInputlistingProps): BlockExtender => {
  return {
    type: "blockExtender",
    function: async () => {
      const result = await lstinputlisting(src, {
        lang,
        title,
        firstLine,
        lastLine,
        firstDisplayNumber,
        showLineNumbers,
        label,
        style,
      });
      return [result];
    },
  };
};

// ------
// Description
// ------

/**
 * {@link Dt} コンポーネントの Props．
 */
export interface DtProps {
  /** 子要素（インライン，見出し）． */
  children?: InlineChildren;
}

/**
 * 説明リストの見出しを生成する．{@link Description} の直下に {@link Dd} と対で配置する．
 */
export const Dt = ({ children }: DtProps): DescTermWrapper => {
  return { type: "descTermWrapper", term: collectInlines(children) };
};

/**
 * {@link Dd} コンポーネントの Props．
 */
export interface DdProps {
  /** 子要素（インライン，本文）． */
  children?: InlineChildren;
}

/**
 * 説明リストの本文を生成する．{@link Description} の直下に {@link Dt} と対で配置する．
 */
export const Dd = ({ children }: DdProps): DescBodyWrapper => {
  return { type: "descBodyWrapper", body: collectInlines(children) };
};

/**
 * {@link Description} コンポーネントの Props．
 */
export interface DescriptionProps {
  /** 子要素（{@link Dt} と {@link Dd} の交互列）． */
  children?: DescriptionChildren;
  /**
   * インデント．
   * @default em(4)
   */
  indent?: number | Em;
  /**
   * 見出しと本文との間で最小限確保すべきスペース．
   * @default em(1)
   */
  space?: number | Em;
  /**
   * 見出しの直後に強制改行を挿入するかどうか．
   * @default false
   */
  termBreak?: boolean;
  /** アイテム間の縦方向のスペース（mm）． */
  gap?: number;
  /** テキストスタイルの上書き． */
  style?: Partial<TextStyle>;
}

/**
 * 説明リストを生成する．子要素として {@link Dt}（見出し）と {@link Dd}（本文）を交互に並べる．
 */
export const Description = ({
  children,
  indent,
  space,
  termBreak,
  gap,
  style,
}: DescriptionProps): minitype.Block[] => {
  return description(collectDescriptionItems(children), {
    indent,
    space,
    termBreak,
    gap,
    style,
  });
};

// ------
// Easytable
// ------

/**
 * {@link Td} コンポーネントの Props．
 */
export interface TdProps {
  /** 子要素（インライン）． */
  children?: InlineChildren;
  /** 列の結合数． */
  colspan?: number;
}

/**
 * Easytable のセルを生成する．
 * children はインライン要素として扱われる．colspan を指定すると列を結合する．
 */
export const Td = ({ children, colspan }: TdProps): EasyCellWrapper => {
  const inlines = collectInlines(children);
  const content: EasyCellContent =
    inlines.length === 1 && typeof inlines[0] === "string"
      ? inlines[0]
      : inlines;
  const cell: EasyCell =
    colspan !== undefined ? span(content, colspan) : content;
  return { type: "easyCellWrapper", cell };
};

/**
 * {@link Tr} コンポーネントの Props．
 */
export interface TrProps {
  /** 子要素（{@link Td} の列）． */
  children?: EasyRowChildren;
}

/**
 * Easytable の行を生成する．子要素として {@link Td} を並べる．
 */
export const Tr = ({ children }: TrProps): EasyRowWrapper => {
  return { type: "easyRowWrapper", cells: collectEasyCells(children) };
};

/**
 * {@link Easytable} コンポーネントの Props．
 */
export interface EasytableProps {
  /** 子要素（{@link Tr} の行）． */
  children?: EasytableChildren;
  /** 表のキャプション．指定すると表とキャプションを Box でラップして返す． */
  caption?: string | minitype.InlineOrExtender[];
  /** 表のラベル．相互参照で用いる文字列キー． */
  label?: string;
  /** 表のスタイル． */
  style?: Partial<minitype.TableStyle>;
}

/**
 * HTML ライクな記法で表を作成する．
 * 子要素として {@link Tr}，その内側に {@link Td} を並べる．
 */
export const Easytable = ({
  children,
  caption,
  label,
  style,
}: EasytableProps): Table | Box => {
  return easytable(collectEasyRows(children), { caption, label, style });
};

// ------
// 目次
// ------

/**
 * {@link Toc} コンポーネントの Props．
 */
export type TocProps = TocOptions;

/**
 * 目次を生成する．
 */
export const Toc = (props: TocProps): BlockExtender => {
  return toc(props);
};

// ------
// ListOf
// ------

/**
 * {@link ListOf} コンポーネントの Props．
 */
export type ListOfProps = ListOfOptions;

/**
 * 図表一覧を生成する．
 */
export const ListOf = (props: ListOfProps): BlockExtender => {
  return listOf(props);
};

/**
 * {@link ListOfImages}，{@link ListOfTables}，{@link ListOfCodes}，{@link ListOfEquations}
 * の共通 Props 型（filter を除く）．
 */
export type ListOfSpecificProps =
  | Omit<ListOfOptionsDefault, "filter">
  | Omit<ListOfOptionsCustom, "filter">;

/**
 * 図の一覧を生成する．
 */
export const ListOfImages = (
  props: ListOfSpecificProps = {},
): BlockExtender => {
  return listOfImages(props);
};

/**
 * 表の一覧を生成する．
 */
export const ListOfTables = (
  props: ListOfSpecificProps = {},
): BlockExtender => {
  return listOfTables(props);
};

/**
 * 数式の一覧を生成する．
 */
export const ListOfEquations = (
  props: ListOfSpecificProps = {},
): BlockExtender => {
  return listOfEquations(props);
};

/**
 * コードの一覧を生成する．
 */
export const ListOfCodes = (props: ListOfSpecificProps = {}): BlockExtender => {
  return listOfCodes(props);
};

// ------
// BackgroundImage
// ------

/**
 * {@link BackgroundImage} コンポーネントの Props．
 */
export interface BackgroundImageProps extends BackgroundImageOptions {
  /** 画像ファイルのパス． */
  src: string;
}

/**
 * 図版をページ全体（あるいは余白を差し引いたサイズ）で背面に配置する BlockExtender．
 * ページサイズは組版処理時に自動取得される．
 */
export const BackgroundImage = ({
  src,
  direction,
  margin,
  page,
  zIndex,
}: BackgroundImageProps): BlockExtender => {
  return backgroundImage(src, { direction, margin, page, zIndex });
};

// ------
// Markdown
// ------

/**
 * {@link MdString} コンポーネントの Props．
 */
export interface MdStringProps {
  /** 子要素（Markdown 文字列）． */
  children?: InlineChildren;
  /** ブロック，インラインのマッピング設定． */
  mapping?: MarkdownMapping;
}

/**
 * Markdown 文字列をブロック列に変換する．
 * children に Markdown テキストを渡す．
 */
export const MdString = ({
  children,
  mapping,
}: MdStringProps): (minitype.Block | BlockExtender)[] => {
  const flat = collectInlineLines(children);
  const source = flat
    .map((line) =>
      line.map((item) => (typeof item === "string" ? item : "")).join(""),
    )
    .join("\n");
  return mdString(source, mapping).blocks;
};

/**
 * {@link MdFile} コンポーネントの Props．
 */
export interface MdFileProps {
  /** Markdown ファイルのパス． */
  src: string;
  /** ブロック，インラインのマッピング設定． */
  mapping?: MarkdownMapping;
}

/**
 * Markdown ファイルを読み込んでブロック列に変換する BlockExtender．
 * ファイルの読み込みは minitype の組版処理時に非同期で実行される．
 */
export const MdFile = ({ src, mapping }: MdFileProps): BlockExtender => {
  return {
    type: "blockExtender",
    function: async () => {
      const { blocks } = await mdFile(src, mapping);
      return blocks;
    },
  };
};

// ------
// Bibliography
// ------

/**
 * {@link StaticBibliography} コンポーネントの Props．
 */
export interface StaticBibliographyProps extends BibliographyOptions {
  /** 参考文献レコード． */
  record: ReferenceRecord;
}

/**
 * {@link ReferenceRecord} を静的な参考文献リストとして展開する．
 * 文中の出現順ソートが不要な場合に使用する．
 */
export const StaticBibliography = ({
  record,
  indent,
  formatter,
}: StaticBibliographyProps): minitype.List[] => {
  return staticBibliography(record, { indent, formatter });
};

/**
 * {@link StaticBibliographyFile} コンポーネントの Props．
 */
export interface StaticBibliographyFileProps extends BibliographyOptions {
  /** BibTeX ファイルのパス． */
  src: string;
}

/**
 * BibTeX ファイルを読み込んで静的な参考文献リストに変換する BlockExtender．
 * ファイルの読み込みは minitype の組版処理時に非同期で実行される．
 */
export const StaticBibliographyFile = ({
  src,
  indent,
  formatter,
}: StaticBibliographyFileProps): BlockExtender => {
  return {
    type: "blockExtender",
    function: async () => {
      const record = await readBibtex(src);
      return staticBibliography(record, { indent, formatter });
    },
  };
};
