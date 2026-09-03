import type {
  DocumentStyle,
  GroupLabelOptions,
  GroupStyle,
  Group as MinitypeGroup,
} from "@minitype/minitype";
import { collectBlocks, collectGroups } from "./children.js";
import type { BlockChildren, GroupChildren } from "./jsx-runtime.js";

/**
 * {@link Document} の戻り値型．
 * minitype() に渡す Group[] と {@link DocumentStyle} を格納する．
 */
export interface DocumentResult {
  /** ページグループの配列．*/
  groups: MinitypeGroup[];
  /** ドキュメントスタイル．*/
  style?: DocumentStyle;
}

/**
 * {@link Document} コンポーネントの Props．
 */
export interface DocumentProps {
  /** 子要素（グループ）．*/
  children?: GroupChildren;
  /** ドキュメントスタイル．*/
  style?: DocumentStyle;
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
