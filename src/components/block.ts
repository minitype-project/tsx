/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import type {
  BlockExtender,
  BlockStyleRecord,
  BoxStyle,
  FlexboxStyle,
  ImageStyle,
  ResetLabelType,
  ShapeStyle,
  TableStyle,
} from "@minitype/minitype";
import {
  collectBlocks,
  collectBoxes,
  collectCells,
  collectRows,
  collectSingleBlock,
} from "../children.js";
import type {
  BlockChildren,
  RowChildren,
  TableChildren,
} from "../jsx-runtime.js";

/**
 * ブロック要素の共通 Props．
 */
export interface AbstractBlockProps {
  /** ブロックのラベル．*/
  label?: string;
  /** ブロックの ID．*/
  id?: string;
}

/**
 * {@link Image} コンポーネントの Props．
 */
export interface ImageProps extends AbstractBlockProps {
  /** 画像ファイルのパス．*/
  src: string;
  /** 画像スタイル．*/
  style?: Partial<ImageStyle>;
}

/**
 * 画像（PNG，JPEG，PDF 等）．
 */
export const Image = ({
  src,
  style,
  label,
  id,
}: ImageProps): minitype.Image => {
  return {
    type: "image",
    src,
    style,
    label,
    id,
  };
};

/**
 * {@link Rect}・{@link Ellipse} コンポーネントの Props．
 */
export interface RectProps extends AbstractBlockProps {
  /** 幅（mm）．*/
  width: number;
  /** 高さ（mm）．*/
  height: number;
  /** 図形スタイル．*/
  style?: Partial<ShapeStyle>;
}

/**
 * 矩形．
 */
export const Rect = ({
  width,
  height,
  style,
  label,
  id,
}: RectProps): minitype.Shape => {
  return {
    type: "shape",
    subtype: "rectangle",
    width,
    height,
    style,
    label,
    id,
  };
};

/**
 * 楕円．
 */
export const Ellipse = ({
  width,
  height,
  style,
  label,
  id,
}: RectProps): minitype.Shape => {
  return {
    type: "shape",
    subtype: "ellipse",
    width,
    height,
    style,
    label,
    id,
  };
};

/**
 * {@link NewPage}・{@link ClearPage}・{@link NewColumn} の共通 Props．
 */
export interface PageControlProps extends AbstractBlockProps {}

const makePageControl = <T extends "newpage" | "clearpage" | "newcolumn">(
  type: T,
) => {
  return ({ label, id }: PageControlProps = {}) => {
    return { type, label, id };
  };
};

/**
 * 改ページ．
 */
export const NewPage = makePageControl("newpage");

/**
 * フロートを出力してから改ページ．
 */
export const ClearPage = makePageControl("clearpage");

/**
 * 改段．
 */
export const NewColumn = makePageControl("newcolumn");

/**
 * {@link Vspace}・{@link Addvspace} コンポーネントの Props．
 */
export interface VspaceProps extends AbstractBlockProps {
  /** スペース量（mm）．*/
  space: number;
}

/**
 * 垂直スペース（絶対値）．
 */
export const Vspace = ({ space, label, id }: VspaceProps): minitype.Vspace => {
  return {
    type: "vspace",
    space,
    label,
    id,
  };
};

/**
 * 垂直スペース（加算）．既存のブロック間 gap に加算する．
 */
export const Addvspace = ({
  space,
  label,
  id,
}: VspaceProps): minitype.Vspace => {
  return {
    type: "vspace",
    space,
    additive: true,
    label,
    id,
  };
};

/**
 * {@link Box} コンポーネントの Props．
 */
export interface BoxProps extends AbstractBlockProps {
  /** 子要素（ブロック）．*/
  children?: BlockChildren;
  /** ボックススタイル．*/
  style?: Partial<BoxStyle>;
  /** セマンティック型．*/
  semanticType?: minitype.Box["semanticType"];
}

/**
 * ブロック要素をまとめるコンテナ．
 */
export const Box = ({
  children,
  style,
  semanticType,
  label,
  id,
}: BoxProps): minitype.Box => {
  return {
    type: "box",
    blocks: collectBlocks(children),
    style,
    semanticType,
    label,
    id,
  };
};

/**
 * {@link Flexbox} コンポーネントの Props．
 */
export interface FlexboxProps extends AbstractBlockProps {
  /** 子要素（`<Box>`）．*/
  children?: BlockChildren;
  /** フレックスボックススタイル．*/
  style?: Partial<FlexboxStyle>;
}

/**
 * 子 {@link Box} をインライン方向に並べるコンテナ．
 */
export const Flexbox = ({
  children,
  style,
  label,
  id,
}: FlexboxProps): minitype.Flexbox => {
  return {
    type: "flexbox",
    boxes: collectBoxes(children) as (minitype.Box | BlockExtender)[],
    style,
    label,
    id,
  };
};

/**
 * {@link Section} コンポーネントの Props．
 */
export interface SectionProps extends AbstractBlockProps {
  /** 子要素（ブロック）．*/
  children?: BlockChildren;
  /** 子ブロックに継承するスタイル．*/
  block?: Partial<BlockStyleRecord>;
}

/**
 * スタイルを子ブロックに継承する透過的なコンテナ．
 */
export const Section = ({
  children,
  block,
  label,
  id,
}: SectionProps): minitype.Section => {
  return {
    type: "section",
    blocks: collectBlocks(children),
    block,
    label,
    id,
  };
};

/**
 * {@link Table} コンポーネントの Props．
 */
export interface TableProps extends AbstractBlockProps {
  /** 子要素（行）．*/
  children?: TableChildren;
  /** テーブルスタイル．*/
  style?: Partial<TableStyle>;
}

/**
 * テーブル．
 */
export const Table = ({
  children,
  style,
  label,
  id,
}: TableProps): minitype.Table => {
  return {
    type: "table",
    rows: collectRows(children),
    style,
    label,
    id,
  };
};

/**
 * {@link Row} コンポーネントの Props．
 */
export interface RowProps {
  /** 子要素（セル）．*/
  children?: RowChildren;
}

/**
 * テーブルの行を生成する．`TableCell[]` を返す．
 */
export const Row = ({ children }: RowProps): minitype.TableCell[] => {
  return collectCells(children);
};

/**
 * {@link Cell} コンポーネントの Props．
 */
export interface CellProps {
  /** 子要素（ブロック，1 つのみ）．*/
  children?: BlockChildren;
  /** 列結合数．*/
  colspan?: number;
}

/**
 * テーブルのセル．子要素はブロック要素 1 つのみ受け付ける．
 */
export const Cell = ({ children, colspan }: CellProps): minitype.TableCell => {
  return { type: "tableCell", block: collectSingleBlock(children), colspan };
};

/**
 * {@link Float} コンポーネントの Props．
 */
export interface FloatProps extends AbstractBlockProps {
  /** 子要素（ブロック）．*/
  children?: BlockChildren;
  /** 配置位置（`"top"` または `"bottom"`）．*/
  position: "top" | "bottom";
}

/**
 * フロート配置コンテナ．ページ上端または下端に固定して配置する．
 */
export const Float = ({
  children,
  position,
  label,
  id,
}: FloatProps): minitype.Float => {
  return {
    type: "float",
    position,
    blocks: collectBlocks(children),
    label,
    id,
  };
};

/**
 * {@link Move} コンポーネントの Props．
 */
export interface MoveProps extends AbstractBlockProps {
  /** 子要素（ブロック）．*/
  children?: BlockChildren;
  /** インライン方向のオフセット（mm）．*/
  inlineOffset?: number;
  /** ブロック方向のオフセット（mm）．*/
  blockOffset?: number;
}

/**
 * ブロック要素をオフセット移動するコンテナ．
 */
export const Move = ({
  children,
  inlineOffset,
  blockOffset,
  label,
  id,
}: MoveProps): minitype.Move => {
  return {
    type: "move",
    blocks: collectBlocks(children),
    inlineOffset,
    blockOffset,
    label,
    id,
  };
};

/**
 * {@link ResetLabel} コンポーネントの Props．
 */
export interface ResetLabelProps extends AbstractBlockProps {
  /** リセットするカウンタの種類．*/
  types?: ResetLabelType[];
}

/**
 * カウンタリセット．見出し番号・図番号などをリセットする．
 */
export const ResetLabel = ({
  types,
  label,
  id,
}: ResetLabelProps): minitype.ResetLabel => {
  return {
    type: "resetLabel",
    types,
    label,
    id,
  };
};
