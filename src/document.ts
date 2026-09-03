/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type {
  GroupLabelOptions,
  GroupStyle,
  Group as MinitypeGroup,
} from "@minitype/minitype";
import { collectBlocks, collectGroups } from "./children.js";
import type {
  BlockChildren,
  DocumentResult,
  GroupChildren,
} from "./jsx-runtime.js";

export type { DocumentResult } from "./jsx-runtime.js";

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
  /** 子要素（ブロック）．*/
  children?: BlockChildren;
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
}: GroupProps): MinitypeGroup => {
  return {
    body: collectBlocks(children),
    style,
    pageIndex,
    labelOptions,
  };
};
