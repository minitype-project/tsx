/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { fn } from "@minitype/minitype";
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
 * {@link Kern} コンポーネントの Props．
 */
export interface KernProps {
  /** カーニング量（em 単位）． */
  em: number;
}

/**
 * カーニング（文字間隔の調整）．
 */
export const Kern = ({ em: emValue }: KernProps): minitype.Kerning => {
  return { type: "kerning", em: emValue };
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
