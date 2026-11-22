/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type {
  HeadingIndex,
  HeadingInPageOptions,
  HeadingLevel,
  InlineExtender,
  InlineOrExtender,
  KentenMark,
  MarkdownMapping,
} from "@minitype/minitype";
import {
  autoref,
  headingInPage,
  kenten,
  listOfIndex,
  marker,
  mdInlineString,
  num,
  page,
  pageref,
  ref,
  si,
  tocIndex,
  totalPages,
} from "@minitype/minitype";
import { collectInlineLines, collectInlines } from "../children.js";
import type { InlineChildren } from "../jsx-runtime.js";

/**
 * {@link Ref} コンポーネントの Props．
 */
export interface RefProps {
  /** 参照先のラベルまたは ID． */
  label: string;
}

/**
 * 参照先の番号に変換するインラインエクステンダ．リンク付き．
 */
export const Ref = ({ label }: RefProps): InlineExtender => {
  return ref(label);
};

/**
 * {@link Pageref} コンポーネントの Props．
 */
export interface PagerefProps {
  /** 参照先のラベルまたは ID． */
  label: string;
}

/**
 * 参照先のページ番号に変換するインラインエクステンダ．
 */
export const Pageref = ({ label }: PagerefProps): InlineExtender => {
  return pageref(label);
};

/**
 * {@link Autoref} コンポーネントの Props．
 */
export interface AutorefProps {
  /** 参照先のラベルまたは ID． */
  label: string;
}

/**
 * 参照先の種類と番号（例：図 1）に変換するインラインエクステンダ．リンク付き．
 */
export const Autoref = ({ label }: AutorefProps): InlineExtender => {
  return autoref(label);
};

// ------
// ページ情報
// ------

/**
 * 現在のページ番号に変換するインラインエクステンダ．
 */
export const Page = (): InlineExtender => {
  return page;
};

/**
 * 総ページ数に変換するインラインエクステンダ．
 */
export const TotalPages = (): InlineExtender => {
  return totalPages;
};

// ------
// その他のインラインエクステンダ
// ------

/**
 * {@link Marker} コンポーネントの Props．
 */
export interface MarkerProps {
  /** マーカの前に挿入する文字列． */
  before: string;
  /** マーカの後に挿入する文字列． */
  after: string;
}

/**
 * リストのマーカに変換するインラインエクステンダ．
 */
export const Marker = ({ before, after }: MarkerProps): InlineExtender => {
  return marker(before, after);
};

/**
 * {@link HeadingInPage} コンポーネントの Props．
 */
export type HeadingInPageProps = HeadingInPageOptions;

/**
 * 現在のページに出現した見出しテキストに変換するインラインエクステンダ．
 * 柱（ランニングヘッダー）として使用することを想定する．
 */
export const HeadingInPage = (
  props: HeadingInPageProps = {},
): InlineExtender => {
  return headingInPage(props);
};

// ------
// 目次，図表一覧
// ------

/**
 * {@link TocIndex} コンポーネントの Props．
 */
export interface TocIndexProps {
  /** 見出しのブロック ID． */
  id: string;
  /** 見出しのレベル． */
  level: HeadingLevel;
  /** 見出し番号の整形関数． */
  format?: (index: HeadingIndex) => string;
}

/**
 * 目次エントリの見出し番号に変換するインラインエクステンダ．
 */
export const TocIndex = ({
  id,
  level,
  format,
}: TocIndexProps): InlineExtender => {
  return tocIndex(id, level, format);
};

/**
 * {@link ListOfIndex} コンポーネントの Props．
 */
export interface ListOfIndexProps {
  /** 図表のブロック ID． */
  id: string;
  /** 図表番号の整形関数． */
  format?: (index: string) => string;
}

/**
 * 図表一覧エントリの番号に変換するインラインエクステンダ．
 */
export const ListOfIndex = ({
  id,
  format,
}: ListOfIndexProps): InlineExtender => {
  return listOfIndex(id, format);
};

// ------
// 圏点
// ------

/**
 * {@link Kenten} コンポーネントの Props．
 */
export interface KentenProps {
  /** 子要素（圏点を付与するインライン）． */
  children?: InlineChildren;
  /**
   * 圏点の記号．プリセット名または任意の 1 文字を指定する．
   * @default "bullet"
   */
  mark?: KentenMark;
}

/**
 * children に圏点を付与するインラインエクステンダ．
 */
export const Kenten = ({ children, mark }: KentenProps): InlineExtender => {
  return kenten(collectInlines(children), mark);
};

// ------
// SI 単位，数値
// ------

/**
 * {@link Num} コンポーネントの Props．
 */
export interface NumProps {
  /** 数値または科学的記数法の文字列（例：`"3.0e8"`）． */
  value: string | number;
}

/**
 * 数値を適切にフォーマットするインライン要素の配列を返す．
 * 科学的記数法の文字列は指数部を上付き文字で表示する．
 */
export const Num = ({ value }: NumProps): InlineOrExtender[] => {
  return num(value);
};

/**
 * {@link Si} コンポーネントの Props．
 */
export interface SiProps {
  /** 数値または科学的記数法の文字列（例：`"3.0e8"`）． */
  value: string | number;
  /**
   * 単位文字列（例：`"kg.m/s^2"`）．
   * `.` で因子を連結，`/` で分母を指定，`^n` で指数を指定する．
   */
  unit: string;
}

/**
 * SI 単位系の数値と単位を適切にフォーマットするインライン要素の配列を返す．
 */
export const Si = ({ value, unit }: SiProps): InlineOrExtender[] => {
  return si(value, unit);
};

// ------
// Markdown インライン
// ------

/**
 * {@link MdInline} コンポーネントの Props．
 */
export interface MdInlineProps {
  /** 子要素（Markdown インライン記法を含む文字列）． */
  children?: InlineChildren;
  /** ブロック，インラインのマッピング設定． */
  mapping?: MarkdownMapping;
}

/**
 * Markdown のインライン記法を含む文字列をインライン要素の配列に変換する．
 * children に Markdown テキストを渡す．
 */
export const MdInline = ({
  children,
  mapping,
}: MdInlineProps): InlineOrExtender[] => {
  const flat = collectInlineLines(children);
  const source = flat
    .map((line) =>
      line.map((item) => (typeof item === "string" ? item : "")).join(""),
    )
    .join("\n");
  return mdInlineString(source, mapping);
};
