/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type {
  Block,
  BlockExtender,
  DocumentStyle,
  EasyCell,
  Flow,
  Group,
  InlineOrExtender,
  TableCell,
} from "@minitype/minitype";

// ------
// 型定義
// ------

/**
 * {@link Dt} コンポーネントが返す，説明リストの見出しのタグ付きラッパー型．
 * {@link collectDescriptionItems} がこの型を識別するために使用する．
 */
export type DescTermWrapper = {
  readonly type: "descTermWrapper";
  term: InlineOrExtender[];
};

/**
 * {@link Dd} コンポーネントが返す，説明リストの本文のタグ付きラッパー型．
 * {@link collectDescriptionItems} がこの型を識別するために使用する．
 */
export type DescBodyWrapper = {
  readonly type: "descBodyWrapper";
  body: InlineOrExtender[];
};

/**
 * {@link Td} コンポーネントが返す，`EasyCell` のタグ付きラッパー型．
 * {@link collectEasyCells} がこの型を識別するために使用する．
 */
export type EasyCellWrapper = {
  readonly type: "easyCellWrapper";
  cell: EasyCell;
};

/**
 * {@link Tr} コンポーネントが返す，`EasyCell[]` のタグ付きラッパー型．
 * {@link collectEasyRows} がこの型を識別するために使用する．
 */
export type EasyRowWrapper = {
  readonly type: "easyRowWrapper";
  cells: EasyCell[];
};

/**
 * 行区切りを表すタグ付きユニオンの判別子型．
 * `<Br />` が返す値であり，`collectInlineLines` が新しい行の開始として扱う．
 * minitype の `InlineOrExtender` とは独立した tsx 固有の型．
 */
export type LineBreak = { readonly type: "br" };

/**
 * {@link Document} コンポーネントの戻り値型．
 * minitype() に渡す Group[] と {@link DocumentStyle} を格納する．
 */
export interface DocumentResult {
  /** ページグループの配列． */
  groups: Group[];
  /** ドキュメントスタイル． */
  style?: Partial<DocumentStyle>;
}

/**
 * JSX 式が評価される型．
 */
export type JsxElement =
  | DocumentResult
  | Flow
  | Block
  | BlockExtender
  | InlineOrExtender
  | LineBreak
  | Group
  | TableCell[]
  | TableCell
  | DescTermWrapper
  | DescBodyWrapper
  | EasyCellWrapper
  | EasyRowWrapper
  | (() => JsxElement)
  | JsxElement[]
  | null
  | undefined;

/**
 * 条件付きレンダリングで生じる無視すべき値．
 * 全 children 型に共通して含まれる．
 */
type Falsy = boolean | null | undefined;

/**
 * グループの children 型．
 * `<Document>` に使用する．
 */
export type GroupChildren = Group | GroupChildren[] | JsxElement | Falsy;

/**
 * ブロック要素の children 型．
 * `<Box>`，`<Group>` 等，ブロック要素を受け取るコンポーネントに使用する．
 */
export type BlockChildren =
  | Block
  | BlockExtender
  | BlockChildren[]
  | JsxElement
  | Falsy;

/**
 * グループ本文の children 型．
 * `<Group>` に使用する．{@link BlockChildren} に加えて {@link Flow} を受け付ける．
 */
export type BodyChildren =
  | Flow
  | Block
  | BlockExtender
  | BodyChildren[]
  | JsxElement
  | Falsy;

/**
 * テーブルの children 型（Row = `TableCell[]` の配列）．
 * `<Table>` に使用する．
 */
export type TableChildren = TableCell[] | TableChildren[] | JsxElement | Falsy;

/**
 * 行の children 型（Cell = `TableCell` の配列）．
 * `<Row>` に使用する．
 */
export type RowChildren = TableCell | RowChildren[] | JsxElement | Falsy;

/**
 * {@link Description} の children 型（{@link DescTermWrapper} と {@link DescBodyWrapper} の交互列）．
 * `<Description>` に使用する．
 */
export type DescriptionChildren =
  | DescTermWrapper
  | DescBodyWrapper
  | DescriptionChildren[]
  | JsxElement
  | Falsy;

/**
 * {@link Easytable} の children 型（{@link EasyRowWrapper} の配列）．
 * `<Easytable>` に使用する．
 */
export type EasytableChildren =
  | EasyRowWrapper
  | EasytableChildren[]
  | JsxElement
  | Falsy;

/**
 * {@link Tr} の children 型（{@link EasyCellWrapper} の配列）．
 * `<Tr>` に使用する．
 */
export type EasyRowChildren =
  | EasyCellWrapper
  | EasyRowChildren[]
  | JsxElement
  | Falsy;

/**
 * インライン要素の children 型．
 * `<P>`，`<B>` 等，インライン要素を受け取るコンポーネントに使用する．
 */
export type InlineChildren =
  | InlineOrExtender
  | LineBreak
  | InlineChildren[]
  | JsxElement
  | string
  | number
  | Falsy;

/**
 * JSX の children として渡せる値の型（全種別の合併型）．
 */
export type JsxChildren =
  | InlineChildren
  | BlockChildren
  | GroupChildren
  | TableChildren
  | RowChildren;

export namespace JSX {
  export type Element = JsxElement;

  export interface ElementChildrenAttribute {
    children: JsxChildren;
  }

  // biome-ignore lint/complexity/noBannedTypes: JSX の型定義として必要
  export type IntrinsicElements = {};
}

// ------
// JSX ランタイム
// ------

/**
 * JSX Fragment．複数の要素をラップせずにグループ化する．
 */
export const Fragment = Symbol.for("minitype.Fragment");

/**
 * コンポーネント関数の戻り値型 `T` を保持するオーバーロードを持つ JSX ファクトリ型．
 * これにより，各 JSX 式がコンポーネントの実際の戻り値型として推論される．
 */
type JsxFactory = {
  <T extends JsxElement>(
    type: (props: Record<string, unknown>) => T,
    props: Record<string, unknown>,
    _key?: string,
  ): T;
  (
    type: JsxElement[] | symbol,
    props: Record<string, unknown>,
    _key?: string,
  ): JsxElement;
};

/**
 * JSX の children を再帰的にフラット化して {@link JsxElement} の配列として返す．
 * 配列は再帰的に展開し，関数は引数なしで呼び出してその結果をフラット化する．
 * `null`，`undefined`，`true`，`false` は無視する．
 */
const flattenChildren = (children: unknown): JsxElement[] => {
  if (children == null || children === true || children === false) {
    return [];
  }
  if (typeof children === "function") {
    return flattenChildren((children as () => JsxElement)());
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenChildren(child));
  }
  return [children as JsxElement];
};

/**
 * JSX ファクトリ関数（automatic transform 用）．
 */
export const jsx: JsxFactory = (
  type:
    | ((props: Record<string, unknown>) => JsxElement)
    | JsxElement[]
    | symbol,
  props: Record<string, unknown>,
  _key?: string,
): JsxElement => {
  if (type === Fragment) {
    return flattenChildren(props.children);
  }
  if (Array.isArray(type)) {
    return flattenChildren(type);
  }
  if (typeof type === "function") {
    return type(props);
  }
  throw new Error(`Unsupported JSX element type: ${String(type)}`);
};

export const jsxs = jsx;
