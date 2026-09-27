/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { InlineChildren } from "./jsx-runtime.js";

// ------
// ソフト改行の正規化
// ------

/**
 * 文字が和文かどうかを判定する．
 * 和文：CJK 統合漢字，ひらがな，カタカナ，全角文字（U+3000–U+9FFF，U+F900–U+FAFF，U+FF00–U+FFEF）
 * 欧文：その他
 */
const isJapanese = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x3000 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xffef)
  );
};

/**
 * インライン要素の先頭の文字を返す．
 * `body` を持たない不可視コンポーネントや空の場合には `null` を返す．
 */
const getFirstTextChar = (value: unknown): string | null => {
  if (typeof value === "string") {
    const s = value.replace(/\n/g, "");
    return s.length > 0 ? s[0] : null;
  }
  if (typeof value === "number") {
    return String(value)[0];
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const char = getFirstTextChar(item);
      if (char !== null) {
        return char;
      }
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const body = (value as Record<string, unknown>).body;
    if (body !== undefined) {
      return getFirstTextChar(body);
    }
  }
  return null;
};

/**
 * インライン要素の末尾の文字を返す．
 * `body` を持たない不可視コンポーネントや空の場合には `null` を返す．
 */
const getLastTextChar = (value: unknown): string | null => {
  if (typeof value === "string") {
    const s = value.replace(/\n/g, "");
    return s.length > 0 ? s[s.length - 1] : null;
  }
  if (typeof value === "number") {
    const s = String(value);
    return s[s.length - 1];
  }
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) {
      const char = getLastTextChar(value[i]);
      if (char !== null) {
        return char;
      }
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const body = (value as Record<string, unknown>).body;
    if (body !== undefined) {
      return getLastTextChar(body);
    }
  }
  return null;
};

/**
 * MDX 段落の children に含まれる \n によるソフト改行を，前後の文字種に基づいてスペースまたは空文字に正規化する．
 * 欧文 + 欧文の場合にはスペースを挿入する．その他の場合には何も挿入しない．
 * { type: "br" } による改行はそのまま保持する．
 */
export const normalizeMdxSoftBreaks = (
  children: InlineChildren,
): InlineChildren => {
  const flat: unknown[] = [];
  const flatten = (val: unknown) => {
    if (val == null || val === true || val === false) {
      return;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        flatten(item);
      }
    } else {
      flat.push(val);
    }
  };
  flatten(children);

  const result: unknown[] = [];

  for (let i = 0; i < flat.length; i++) {
    const item = flat[i];
    if (typeof item !== "string" || !item.includes("\n")) {
      result.push(item);
      continue;
    }

    const parts = item.split("\n");
    for (let j = 0; j < parts.length; j++) {
      if (j > 0) {
        // \n による改行：前後の文字種を取得してセパレータを決定
        let prevChar: string | null = null;
        const prevPart = parts[j - 1];
        if (prevPart.length > 0) {
          prevChar = prevPart[prevPart.length - 1];
        } else {
          for (let k = result.length - 1; k >= 0; k--) {
            // { type: "br" } による改行に達したら探索を停止
            const r = result[k];
            if (
              typeof r === "object" &&
              r !== null &&
              (r as { type?: unknown }).type === "br"
            ) {
              break;
            }
            prevChar = getLastTextChar(r);
            if (prevChar !== null) {
              break;
            }
          }
        }

        let nextChar: string | null = null;
        const nextPart = parts[j];
        if (nextPart.length > 0) {
          nextChar = nextPart[0];
        } else {
          // 残りのパーツから先頭文字を探索
          let found = false;
          for (let k = j + 1; k < parts.length; k++) {
            if (parts[k].length > 0) {
              nextChar = parts[k][0];
              found = true;
              break;
            }
          }
          // 後続アイテムから先頭文字を探索
          if (!found) {
            for (let k = i + 1; k < flat.length; k++) {
              nextChar = getFirstTextChar(flat[k]);
              if (nextChar !== null) {
                break;
              }
            }
          }
        }

        // 欧文 + 欧文：スペースを挿入
        // それ以外：何も挿入しない
        if (
          prevChar !== null &&
          nextChar !== null &&
          !isJapanese(prevChar) &&
          !isJapanese(nextChar)
        ) {
          result.push(" ");
        }
      }
      if (parts[j]) {
        result.push(parts[j]);
      }
    }
  }

  return result as InlineChildren;
};
