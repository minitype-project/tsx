/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { evaluateMdxString } from "../evaluate.js";

const getP = async (
  md: string,
  options?: Parameters<typeof evaluateMdxString>[1],
): Promise<minitype.Text> => {
  const { blocks } = await evaluateMdxString(md, options);
  return (
    Array.isArray(blocks) ? (blocks as minitype.Block[])[0] : blocks
  ) as minitype.Text;
};

describe("ソフト改行（文字種による振る舞い）", () => {
  it("欧文 + 欧文 の改行がスペースになる", async () => {
    const result = await getP("hello\nworld");

    expect(result.lines).toEqual([["hello", " ", "world"]]);
  });

  it("和文 + 和文 の改行には何も挿入しない", async () => {
    const result = await getP("日本語\n和文");

    expect(result.lines).toEqual([["日本語", "和文"]]);
  });

  it("和文 + 欧文 の改行には何も挿入しない", async () => {
    const result = await getP("日本語\nhello");

    expect(result.lines).toEqual([["日本語", "hello"]]);
  });

  it("欧文 + 和文 の改行には何も挿入しない", async () => {
    const result = await getP("hello\n日本語");

    expect(result.lines).toEqual([["hello", "日本語"]]);
  });

  it("欧文 + 欧文 の複数ソフト改行がそれぞれスペースになる", async () => {
    const result = await getP("line1\nline2\nline3");

    expect(result.lines).toEqual([["line1", " ", "line2", " ", "line3"]]);
  });

  it("インライン装飾後の欧文の改行がスペースになる", async () => {
    const result = await getP("**bold**\ntext");

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0][0]).toMatchObject({ type: "command", name: "b" });
    expect(result.lines[0][1]).toBe(" ");
    expect(result.lines[0][2]).toBe("text");
  });

  it("インライン装飾後の和文の改行には何も挿入しない", async () => {
    const result = await getP("**太字**\n和文");

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0][0]).toMatchObject({ type: "command", name: "b" });
    expect(result.lines[0][1]).toBe("和文");
  });
});

describe("末尾スペース 2 つによる改行", () => {
  it("末尾スペース 2 つ + 改行が改行になる", async () => {
    const result = await getP("hello  \nworld");

    expect(result.lines).toEqual([["hello"], ["world"]]);
  });

  it("インライン装飾後の末尾スペース 2 つ + 改行が改行になる", async () => {
    const result = await getP("**bold**  \nworld");

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0][0]).toMatchObject({ type: "command", name: "b" });
    expect(result.lines[1][0]).toBe("world");
  });
});

describe("バックスラッシュによる改行", () => {
  it("バックスラッシュ + 改行が改行になる", async () => {
    const result = await getP("hello\\\nworld");

    expect(result.lines).toEqual([["hello"], ["world"]]);
  });

  it("インライン装飾後のバックスラッシュ改行が改行になる", async () => {
    const result = await getP("**bold**\\\nworld");

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0][0]).toMatchObject({ type: "command", name: "b" });
    expect(result.lines[1][0]).toBe("world");
  });
});

describe("空行による段落区切り", () => {
  it("空行を挟むと段落が 2 つに分かれる", async () => {
    const { blocks } = await evaluateMdxString("hello\n\nworld");
    const result = blocks as minitype.Block[];

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: "text", textType: "paragraph" });
    expect(result[1]).toMatchObject({ type: "text", textType: "paragraph" });
    expect((result[0] as minitype.Text).lines).toEqual([["hello"]]);
    expect((result[1] as minitype.Text).lines).toEqual([["world"]]);
  });

  it("空行を挟むと段落が 3 つに分かれる", async () => {
    const { blocks } = await evaluateMdxString("first\n\nsecond\n\nthird");
    const result = blocks as minitype.Block[];

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ type: "text", textType: "paragraph" });
    expect(result[1]).toMatchObject({ type: "text", textType: "paragraph" });
    expect(result[2]).toMatchObject({ type: "text", textType: "paragraph" });
    expect((result[0] as minitype.Text).lines).toEqual([["first"]]);
    expect((result[1] as minitype.Text).lines).toEqual([["second"]]);
    expect((result[2] as minitype.Text).lines).toEqual([["third"]]);
  });

  it("段落内複数行と段落区切りがそれぞれ処理される", async () => {
    const { blocks } = await evaluateMdxString(
      "first\nparagraph\n\nnext paragraph",
    );
    const result = blocks as minitype.Block[];

    expect(result).toHaveLength(2);
    expect((result[0] as minitype.Text).lines).toEqual([
      ["first", " ", "paragraph"],
    ]);
    expect((result[1] as minitype.Text).lines).toEqual([["next paragraph"]]);
  });
});

describe("脚注内の改行", () => {
  // 行末の 2 スペースおよびバックスラッシュは，Markdown の強制改行（hard break）の記法．
  // 改行後の 4 スペースは脚注の継続行のインデント．
  it.each(["  \n    ", "\\\n    ", "<br />", "<Br />"])(
    "%j による改行を保持する",
    async (separator) => {
      const { blocks } = await evaluateMdxString(
        `本文[^note]\n\n[^note]: first${separator}second`,
      );
      const footnote = (blocks as minitype.Block[])
        .flat(Infinity)
        .find((block) => block.type === "footnote") as minitype.Footnote;

      expect(footnote).toBeDefined();
      expect(
        footnote.lines.map((line) =>
          line
            .filter((inline) => typeof inline === "string")
            .join("")
            .trim(),
        ),
      ).toEqual(["first", "second"]);
    },
  );
});

describe("ソフト改行（サロゲートペア）", () => {
  it("CJK 統合漢字拡張 B の文字を和文として扱う", async () => {
    expect((await getP("𠮟\n和文")).lines).toEqual([["𠮟", "和文"]]);
    expect((await getP("和文\n𠮟")).lines).toEqual([["和文", "𠮟"]]);
  });
});
