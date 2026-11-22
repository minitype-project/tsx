/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * 和文文字・全角文字の範囲．正規表現の文字クラスに `u` フラグ付きで埋め込んで用いる．
 * - U+3000–U+9FFF：CJK 記号・句読点，仮名，CJK 統合漢字など
 * - U+F900–U+FAFF：CJK 互換漢字
 * - U+FF00–U+FFEF：全角英数字・記号
 * - U+20000–U+3FFFF：CJK 統合漢字拡張 B 以降（「𠮟」など）
 */
export const CJK_OR_FULLWIDTH_CHARS =
  "\\u3000-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef\\u{20000}-\\u{3ffff}";

/**
 * 和文文字・全角文字を含むかどうかを判定する正規表現．
 */
export const CJK_OR_FULLWIDTH = new RegExp(`[${CJK_OR_FULLWIDTH_CHARS}]`, "u");
