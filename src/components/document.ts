/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import type {
  GroupLabelOptions,
  GroupStyle,
  PageFilter,
  WritingMode,
} from "@minitype/minitype";
import { collectBlocks, collectBody, collectGroups } from "../children.js";
import type {
  BlockChildren,
  BodyChildren,
  DocumentResult,
  GroupChildren,
} from "../jsx-runtime.js";

export type { DocumentResult } from "../jsx-runtime.js";

/**
 * {@link Document} コンポーネントの Props．
 */
export interface DocumentProps {
  /** 子要素（グループ）．*/
  children?: GroupChildren;
  /** ドキュメントスタイル．*/
  style?: DocumentResult["style"];
}

/**
 * ドキュメントルートを生成する．
 */
export const Document = ({
  children,
  style,
}: DocumentProps): DocumentResult => {
  return {
    groups: collectGroups(children),
    style,
  };
};

/**
 * {@link Group} コンポーネントの Props．
 */
export interface GroupProps {
  /** 子要素（ブロック，フロー）．*/
  children?: BodyChildren;
  /** グループスタイル．*/
  style?: GroupStyle;
  /** 開始ページ番号．*/
  pageIndex?: number;
  /** ラベルオプション．*/
  labelOptions?: GroupLabelOptions;
}

/**
 * グループを生成する．
 */
export const Group = ({
  children,
  style,
  pageIndex,
  labelOptions,
}: GroupProps): minitype.Group => {
  return {
    body: collectBody(children),
    style,
    pageIndex,
    labelOptions,
  };
};

/**
 * {@link Flow} コンポーネントの Props．
 */
export interface FlowProps {
  /** 子要素（ブロック）．*/
  children?: BlockChildren;
  /**
   * フローの基準位置．
   * - `"pillar"`：版面上端（縦組の場合は右端）
   * - `"nombre"`：版面下端（縦組の場合は左端）
   * - `"page"`：ページ左上
   */
  position: minitype.Flow["position"];
  /** インライン方向のオフセット（mm）．*/
  inlineOffset?: number;
  /** ブロック方向のオフセット（mm）．*/
  blockOffset?: number;
  /** インライン方向のサイズ（mm）．*/
  inlineSize?: number;
  /** 表示するページ（ページ番号またはフィルタ関数）．*/
  page?: number | PageFilter;
  /** 書字方向．*/
  writingMode?: WritingMode;
  /** 重ね順序．*/
  zIndex?: number;
}

/**
 * フロー．版面上端・下端・ページ左上を基準に要素を絶対配置する．
 */
export const Flow = ({
  children,
  position,
  inlineOffset,
  blockOffset,
  inlineSize,
  page,
  writingMode,
  zIndex,
}: FlowProps): minitype.Flow => {
  return {
    type: "flow",
    position,
    blocks: collectBlocks(children),
    inlineOffset,
    blockOffset,
    inlineSize,
    page,
    writingMode,
    zIndex,
  };
};
