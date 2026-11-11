/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { expect, it } from "vitest";
import type { JsxElement } from "../../jsx/jsx-runtime.js";
import { evaluateMdxString } from "../evaluate.js";

/**
 * コードフェンスを評価して，`pre` に渡される mdxCode オブジェクトを返す．
 */
const getCode = async (md: string): Promise<unknown> => {
  const { blocks } = await evaluateMdxString(md, {
    components: { pre: ({ children }: { children: JsxElement }) => children },
  });
  return blocks;
};

it("lang のコロン以降と空白を含む meta を，省略せずに meta として保持する", async () => {
  expect(await getCode("```ts:キャプション 複数 語#lst:foo\na b\n```")).toEqual(
    {
      _type: "mdxCode",
      lang: "ts",
      meta: "キャプション 複数 語#lst:foo",
      content: "a b\n",
    },
  );
});

it("全角空白を含むキャプションを meta として保持する", async () => {
  expect(await getCode("```ts:キャプション　全角\na\n```")).toEqual({
    _type: "mdxCode",
    lang: "ts",
    meta: "キャプション　全角",
    content: "a\n",
  });
});

it("コロンを含まない lang の meta を保持する", async () => {
  expect(await getCode("```ts title\na\n```")).toEqual({
    _type: "mdxCode",
    lang: "ts",
    meta: "title",
    content: "a\n",
  });
});

it("meta のないコードフェンスには meta を付与しない", async () => {
  expect(await getCode("```ts\na\n```")).toEqual({
    _type: "mdxCode",
    lang: "ts",
    content: "a\n",
  });
});
