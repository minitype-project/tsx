/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { describe, expect, it } from "vitest";
import { evaluateMdxString } from "../evaluate.js";

/**
 * ブロックやインライン要素に含まれる文字列を，出現順に連結して返す．
 */
const flatten = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(flatten).join("");
  }
  if (value && typeof value === "object") {
    const node = value as { blocks?: unknown; lines?: unknown; body?: unknown };
    return flatten(node.blocks ?? node.lines ?? node.body);
  }
  return "";
};

/**
 * リンクを `[表示テキスト](href)` 形式の文字列に置き換えて，文書全体を 1 つの文字列として返す．
 */
const render = async (md: string): Promise<string> => {
  const { blocks } = await evaluateMdxString(md, {
    components: {
      a: ({ href, children }: { href: string; children: string }) =>
        `[${children}](${href})`,
    },
  });
  return flatten(blocks);
};

describe("自動リンクの終端", () => {
  it("URL の直後の CJK 文字・全角文字は URL に含めない", async () => {
    const link = "[https://example.com](https://example.com)";
    for (const suffix of [
      "）",
      "。",
      "、",
      "．",
      "，",
      "」",
      "（参考）",
      "：説明",
      "！",
      "〜",
      "ＡＢＣ",
      "を参照",
      "漢字",
    ]) {
      expect(await render(`https://example.com${suffix}`)).toBe(
        `${link}${suffix}`,
      );
    }
    expect(await render("詳細はhttps://example.comを参照")).toBe(
      `詳細は${link}を参照`,
    );
  });

  it("対応の取れていない閉じ括弧で URL を打ち切る", async () => {
    expect(await render("https://example.com/a)を参照")).toBe(
      "[https://example.com/a](https://example.com/a))を参照",
    );
  });

  it("打ち切った URL の末尾の句読点は URL に含めない", async () => {
    expect(await render("https://example.com/a.を参照")).toBe(
      "[https://example.com/a](https://example.com/a).を参照",
    );
  });

  it("対応の取れた括弧は URL に含める", async () => {
    const url = "https://en.wikipedia.org/wiki/Foo_(bar)";
    expect(await render(`${url}を参照`)).toBe(`[${url}](${url})を参照`);
  });

  it("同じ段落にある複数の自動リンクをそれぞれ打ち切る", async () => {
    expect(await render("https://a.com）, https://b.com）")).toBe(
      "[https://a.com](https://a.com)）, [https://b.com](https://b.com)）",
    );
  });

  it("強調，リスト内の自動リンクも打ち切る", async () => {
    const link = "[https://example.com](https://example.com)";
    expect(await render("**https://example.com）**")).toBe(`${link}）`);
    expect(await render("- https://example.com）")).toBe(`${link}）`);
  });

  it("URL 中の和文文字の直前で打ち切る", async () => {
    expect(await render("https://ja.wikipedia.org/wiki/日本")).toBe(
      "[https://ja.wikipedia.org/wiki/](https://ja.wikipedia.org/wiki/)日本",
    );
  });

  it("www. から始まる自動リンクも打ち切る", async () => {
    expect(await render("www.example.com。")).toBe(
      "[www.example.com](http://www.example.com)。",
    );
  });

  it("[text](url) 形式のリンクは変更しない", async () => {
    expect(
      await render("[https://example.com/あ](https://example.com/あ)"),
    ).toBe("[https://example.com/あ](https://example.com/%E3%81%82)");
  });
});

describe("自動リンクの終端（サロゲートペア）", () => {
  it("CJK 統合漢字拡張 B の文字の直前で URL を打ち切る", async () => {
    expect(await render("https://example.com𠮟る")).toBe(
      "[https://example.com](https://example.com)𠮟る",
    );
  });
});
