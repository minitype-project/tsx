/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { fn, noBreakSpace } from "@minitype/minitype";
import type { LineBreak } from "../jsx-runtime.js";

/**
 * 行区切り．`InlineOrExtender[][]` における行の境界を作る．
 */
export const Br = (): LineBreak => {
  return { type: "br" };
};

/**
 * 強制改行．行を途中で折り返す．
 */
export const Fbr = (): minitype.ForceBreak => {
  return { type: "force-break" };
};

/**
 * 改行可能箇所．
 * URL などの純 ASCII テキスト内で，任意の位置に改行可能点を提供する．
 */
export const Wbr = (): minitype.Wbr => {
  return { type: "wbr" };
};

/**
 * {@link Kern}，{@link Addkern} コンポーネントの Props．
 */
export interface KernProps {
  /** カーニング量（em 単位）． */
  em: number;
}

/**
 * カーニング．
 * 自動で挿入されるアキ（約物アキ等，和欧間アキ）を上書きする．
 */
export const Kern = ({ em: emValue }: KernProps): minitype.Kerning => {
  return { type: "kerning", em: emValue };
};

/**
 * 加算カーニング．
 * 直後の文字の前に自動で挿入されるアキ（和欧間アキ，約物のアキ等）に加算する．
 */
export const Addkern = ({ em: emValue }: KernProps): minitype.Kerning => {
  return { type: "kerning", em: emValue, additive: true };
};

/**
 * 行分割禁止．
 */
export const NoBreak = (): minitype.NoBreak => {
  return { type: "no-break" };
};

/**
 * 行分割，トラッキング挿入禁止．
 */
export const NoSplit = (): minitype.NoSplit => {
  return { type: "no-split" };
};

/**
 * ノーブレークスペース（U+00A0）．
 * 前後での行分割を禁止した空白として扱われる（LaTeX の `~` に相当）．
 * 通常の空白と同じ幅を持ち，伸縮する．
 */
export const NoBreakSpace = (): string => {
  return noBreakSpace();
};

/**
 * ここまでインデント．
 * テキストブロックの 1 行目に置くと，2 行目以降をマーカの位置までインデントする．
 * 1 行目以外にあるマーカは無視される．
 */
export const IndentHere = (): minitype.IndentHere => {
  return { type: "indent-here" };
};

/**
 * {@link Cid} コンポーネントの Props．
 */
export interface CidProps {
  /** CID 番号． */
  cid: number;
}

/**
 * CID 直接指定．
 */
export const Cid = ({ cid }: CidProps): minitype.Cid => {
  return { type: "cid", cid };
};

/**
 * {@link Fn} コンポーネントの Props．
 */
export interface FnProps {
  /** 参照する脚注のラベル（{@link Footnote} の `label` と対応）． */
  label: string;
}

/**
 * 脚注参照マーカ．{@link Footnote} と {@link label} を対応させる．
 */
export const Fn = ({ label }: FnProps) => {
  return fn(label);
};
