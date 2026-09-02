import type {
  Block,
  BlockExtender,
  Group,
  InlineOrExtender,
  TableCell,
} from "@minitype/minitype";

// ------
// 型定義
// ------
/**
 * 行区切りを表すタグ付きユニオンの判別子型．
 * `<Br />` が返す値であり，`collectInlineLines` が新しい行の開始として扱う．
 * minitype の `InlineOrExtender` とは独立した tsx 固有の型．
 */
export type LineBreak = { readonly type: "br" };

/**
 * JSX 式が評価される型．
 */
export type JsxElement =
  | Block
  | InlineOrExtender
  | LineBreak
  | Group
  | TableCell[]
  | TableCell
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
export type GroupChildren = Group | GroupChildren[] | Falsy;

/**
 * ブロック要素の children 型．
 * `<Box>`，`<Group>` 等，ブロック要素を受け取るコンポーネントに使用する．
 */
export type BlockChildren = Block | BlockExtender | BlockChildren[] | Falsy;

/**
 * テーブルの children 型（Row = `TableCell[]` の配列）．
 * `<Table>` に使用する．
 */
export type TableChildren = TableCell[] | TableChildren[] | Falsy;

/**
 * 行の children 型（Cell = `TableCell` の配列）．
 * `<Row>` に使用する．
 */
export type RowChildren = TableCell | RowChildren[] | Falsy;

/**
 * インライン要素の children 型．
 * `<P>`，`<B>` 等，インライン要素を受け取るコンポーネントに使用する．
 */
export type InlineChildren =
  | InlineOrExtender
  | LineBreak
  | InlineChildren[]
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
 * JSX ファクトリ関数（automatic transform 用）．
 */
export const jsx = (
  type: ((props: Record<string, unknown>) => JsxElement) | symbol,
  props: Record<string, unknown>,
  _key?: string,
): JsxElement => {
  if (type === Fragment) {
    const children = props.children;
    if (Array.isArray(children)) {
      return children as JsxElement[];
    }
    return children as JsxElement;
  }
  if (typeof type === "function") {
    return type(props);
  }
  throw new Error(`Unsupported JSX element type: ${String(type)}`);
};

export const jsxs = jsx;
