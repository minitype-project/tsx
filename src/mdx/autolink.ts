/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CJK_OR_FULLWIDTH } from "../char.js";

/**
 * URL 末尾から除く句読点．
 */
const TRAILING_PUNCTUATION = /[.,:;!?]+$/;

type AutolinkNode = {
  type?: string;
  url?: string;
  value?: string;
  position?: { start?: { offset?: number } };
  children?: AutolinkNode[];
};

/**
 * 自動リンクの表示テキストから，URL として扱う先頭部分の長さを返す．
 * 和文文字・全角文字，対応の取れていない `)` の直前を終端とし，末尾の句読点を除く．
 */
const getUrlLength = (text: string): number => {
  let depth = 0;
  let end = text.length;
  let i = 0;
  for (const char of text) {
    if (CJK_OR_FULLWIDTH.test(char)) {
      end = i;
      break;
    }
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      if (depth === 0) {
        end = i;
        break;
      }
      depth--;
    }
    i += char.length;
  }
  return text.slice(0, end).replace(TRAILING_PUNCTUATION, "").length;
};

/**
 * `node` が remark-gfm の自動リンク（リテラル URL から生成されたリンク）かどうかを判定する．
 * `[text](url)` 形式のリンクは，リンクと表示テキストの開始位置が `[` の分だけずれることで区別する．
 */
const isAutolinkLiteral = (node: AutolinkNode): boolean => {
  const child = node.children?.[0];
  return (
    node.type === "link" &&
    node.children?.length === 1 &&
    child?.type === "text" &&
    typeof child.value === "string" &&
    typeof node.url === "string" &&
    node.url.endsWith(child.value) &&
    node.position?.start?.offset !== undefined &&
    node.position.start.offset === child.position?.start?.offset
  );
};

/**
 * remark-gfm の自動リンクの終端を和文に合わせて補正するプラグイン．
 * remark-gfm は空白までを URL とみなすため，直後に続く `）` や仮名・漢字も URL に含めてしまう．
 * 和文文字・全角文字，対応の取れていない `)` の直前で URL を打ち切り，残りを後続のテキストに戻す．
 *
 * @example
 * `https://example.com）を参照` → リンク `https://example.com` + テキスト `）を参照`
 */
export const remarkCjkAutolink = () => {
  return (tree: AutolinkNode) => {
    const walk = (parent: AutolinkNode) => {
      const children = parent.children;
      if (!children) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (!isAutolinkLiteral(node)) {
          walk(node);
          continue;
        }
        const text = node.children![0];
        const value = text.value!;
        const length = getUrlLength(value);
        if (length === value.length) {
          continue;
        }
        const rest = value.slice(length);
        text.value = value.slice(0, length);
        node.url = node.url!.slice(0, node.url!.length - rest.length);
        const next = children[i + 1];
        if (next?.type === "text") {
          next.value = rest + (next.value ?? "");
        } else {
          children.splice(i + 1, 0, { type: "text", value: rest });
        }
        i++;
      }
    };
    walk(tree);
  };
};
