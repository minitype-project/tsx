/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type MiniTypeOptions, minitype } from "@minitype/minitype";
import type { DocumentResult, JsxElement } from "./jsx-runtime.js";

/**
 * JSX で記述したドキュメントを組版する．
 * `<Document>` の JSX 式を受け取り，`minitype()` を呼び出す．
 */
export const minitypeJSX = (
  document: JsxElement,
  options?: MiniTypeOptions,
) => {
  const { groups, style } = document as DocumentResult;
  return minitype(groups, style, options);
};
