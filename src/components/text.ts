/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import type {
  CodeStyle,
  FootnoteStyle,
  ListStyle,
  MathStyle,
  TextStyle,
} from "@minitype/minitype";
import { collectInlineLines } from "../children.js";
import type { InlineChildren } from "../jsx-runtime.js";
import type { AbstractBlockProps } from "./block.js";

/**
 * テキスト系ブロックコンポーネント（{@link P}，{@link H1} 等）の共通 Props．
 */
export interface TextBlockProps extends AbstractBlockProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** テキストスタイル．*/
  style?: Partial<TextStyle>;
}

/**
 * 見出し系コンポーネント（{@link H1}〜{@link H4}）の Props．
 */
export interface HeadingProps extends TextBlockProps {
  /** 番号を付与しない場合に `true` を指定する．*/
  unnumbered?: boolean;
}

/**
 * 段落．
 */
export const P = ({
  children,
  style,
  label,
  id,
}: TextBlockProps): minitype.Text => {
  return {
    type: "text",
    textType: "paragraph",
    lines: collectInlineLines(children),
    style,
    label,
    id,
  };
};

const makeHeading = <T extends "h1" | "h2" | "h3" | "h4">(textType: T) => {
  return ({
    children,
    style,
    label,
    id,
    unnumbered,
  }: HeadingProps): minitype.Text => {
    return {
      type: "text",
      textType,
      lines: collectInlineLines(children),
      style,
      unnumbered,
      label,
      id,
    };
  };
};

/**
 * 見出し（レベル 1）．
 */
export const H1 = makeHeading("h1");

/**
 * 見出し（レベル 2）．
 */
export const H2 = makeHeading("h2");

/**
 * 見出し（レベル 3）．
 */
export const H3 = makeHeading("h3");

/**
 * 見出し（レベル 4）．
 */
export const H4 = makeHeading("h4");

/**
 * キャプション．
 */
export const Caption = ({
  children,
  style,
  label,
  id,
}: TextBlockProps): minitype.Text => {
  return {
    type: "text",
    textType: "caption",
    lines: collectInlineLines(children),
    style,
    label,
    id,
  };
};

/**
 * {@link Code} コンポーネントの Props．
 */
export interface CodeProps extends AbstractBlockProps {
  /** 子要素（インライン，コード文字列）．*/
  children?: InlineChildren;
  /** 言語名（シンタックスハイライト用）．*/
  lang?: string;
  /** コードブロックスタイル．*/
  style?: Partial<TextStyle & CodeStyle>;
}

/**
 * コードブロック．
 */
export const Code = ({
  children,
  lang,
  style,
  label,
  id,
}: CodeProps): minitype.Code => {
  const flat = collectInlineLines(children);
  const lines = flat.map((line) =>
    line.map((item) => (typeof item === "string" ? item : "")).join(""),
  );
  return {
    type: "code",
    lines,
    lang,
    style,
    label,
    id,
  };
};

/**
 * リスト系コンポーネント（{@link Li1}，{@link Ol1} 等）の共通 Props．
 */
export interface ListProps extends AbstractBlockProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** リストスタイル．*/
  style?: Partial<TextStyle & ListStyle>;
}

const makeList = <L extends "unordered" | "ordered", N extends 1 | 2 | 3>(
  listType: L,
  level: N,
) => {
  return ({ children, style, label, id }: ListProps): minitype.List => {
    return {
      type: "list",
      listType,
      level,
      lines: collectInlineLines(children),
      style,
      label,
      id,
    };
  };
};

/**
 * 順序なしリスト（レベル 1）．
 */
export const Li1 = makeList("unordered", 1);

/**
 * 順序なしリスト（レベル 2）．
 */
export const Li2 = makeList("unordered", 2);

/**
 * 順序なしリスト（レベル 3）．
 */
export const Li3 = makeList("unordered", 3);

/**
 * 順序付きリスト（レベル 1）．
 */
export const Ol1 = makeList("ordered", 1);

/**
 * 順序付きリスト（レベル 2）．
 */
export const Ol2 = makeList("ordered", 2);

/**
 * 順序付きリスト（レベル 3）．
 */
export const Ol3 = makeList("ordered", 3);

/**
 * {@link Footnote} コンポーネントの Props．
 */
export interface FootnoteProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** 脚注のラベル（{@link Fn} と対応させる）．*/
  label: string;
  /** 脚注スタイル．*/
  style?: Partial<TextStyle & FootnoteStyle>;
  /** ブロックの ID．*/
  id?: string;
}

/**
 * 脚注本文．{@link Fn} で参照する．
 */
export const Footnote = ({
  children,
  label,
  style,
  id,
}: FootnoteProps): minitype.Footnote => {
  return {
    type: "footnote",
    label,
    lines: collectInlineLines(children),
    style,
    id,
  };
};

/**
 * {@link Math} コンポーネントの Props．
 */
export interface MathProps extends AbstractBlockProps {
  /** 子要素（インライン，LaTeX 文字列）．*/
  children?: InlineChildren;
  /** 数式スタイル．*/
  style?: Partial<MathStyle>;
}

/**
 * 数式ブロック（LaTeX）．
 */
export const MathBlock = ({
  children,
  style,
  label,
  id,
}: MathProps): minitype.MathBlock => {
  const flat = collectInlineLines(children);
  const lines = flat.map((line) =>
    line.map((item) => (typeof item === "string" ? item : "")).join(""),
  );
  return {
    type: "math",
    lines,
    style,
    label,
    id,
  };
};
