/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { B, Box, Br, Caption, H1, H4, Li1, P } from "../index.js";

describe("<P>", () => {
  it("テキストを段落に変換する", () => {
    const result = (<P>hello</P>) as minitype.Text;
    expect(result).toMatchObject({
      type: "text",
      textType: "paragraph",
      lines: [["hello"]],
    });
  });

  it("数値を文字列に変換する", () => {
    const result = (<P>{42}</P>) as minitype.Text;
    expect(result.lines).toEqual([["42"]]);
  });

  it("{false}/{null} を無視する", () => {
    const result = (
      <P>
        {false}visible{null}
      </P>
    ) as minitype.Text;
    expect(result.lines).toEqual([["visible"]]);
  });

  it("インライン要素を含む行を生成する", () => {
    const result = (
      <P>
        hello <B>world</B>
      </P>
    ) as minitype.Text;
    expect(result.lines[0][0]).toBe("hello ");
    expect(result.lines[0][1]).toMatchObject({ type: "command", name: "b" });
  });

  it("<Br/> で複数行に分割する", () => {
    const result = (
      <P>
        line1
        <Br />
        line2
      </P>
    ) as minitype.Text;
    expect(result.lines).toEqual([["line1"], ["line2"]]);
  });

  it("\\n で複数行に分割する", () => {
    const result = (<P>{"line1\nline2"}</P>) as minitype.Text;
    expect(result.lines).toEqual([["line1"], ["line2"]]);
  });

  it("CJK 文字間のスペースを保持する（意図的なスペース）", () => {
    const result = (<P>{"日本語 テキスト"}</P>) as minitype.Text;
    expect(result.lines).toEqual([["日本語 テキスト"]]);
  });

  it("CJK 文字間の複数スペースをすべて保持する", () => {
    const result = (
      <P>{"筑波大学大学院 理工情報生命学術院 システム情報工学研究群"}</P>
    ) as minitype.Text;
    expect(result.lines).toEqual([
      ["筑波大学大学院 理工情報生命学術院 システム情報工学研究群"],
    ]);
  });

  it("直接記述した CJK 文字間の複数スペースをすべて保持する", () => {
    const result = (
      <P>筑波大学大学院 理工情報生命学術院 システム情報工学研究群</P>
    ) as minitype.Text;
    expect(result.lines).toEqual([
      ["筑波大学大学院 理工情報生命学術院 システム情報工学研究群"],
    ]);
  });

  it("欧文の単語間スペースは保持する", () => {
    const result = (<P>{"hello world"}</P>) as minitype.Text;
    expect(result.lines).toEqual([["hello world"]]);
  });

  it("CJK と欧文の間のスペースは保持する", () => {
    const result = (<P>{"日本語 text"}</P>) as minitype.Text;
    expect(result.lines).toEqual([["日本語 text"]]);
  });

  it("テキストノードの先頭 CJK スペースを除去する", () => {
    // <B>太字</B> 続きのテキスト → " 続きのテキスト" の先頭スペースが除去される
    const result = (
      <P>
        <B>太字</B> 続きのテキスト
      </P>
    ) as minitype.Text;
    expect(result.lines[0][1]).toBe("続きのテキスト");
  });

  it("テキストノードの末尾 CJK スペースを除去する", () => {
    // テキスト <B>太字</B> → "テキスト " の末尾スペースが除去される
    const result = (
      <P>
        テキスト <B>太字</B>
      </P>
    ) as minitype.Text;
    expect(result.lines[0][0]).toBe("テキスト");
  });

  it("欧文の末尾スペースは除去しない", () => {
    // "hello " <B>world</B> → 欧文後のスペースは保持される
    const result = (
      <P>
        hello <B>world</B>
      </P>
    ) as minitype.Text;
    expect(result.lines[0][0]).toBe("hello ");
  });

  it("ブロック要素を子に持つとエラーを投げる", () => {
    expect(() => (
      <P>
        <Box />
      </P>
    )).toThrow(/cannot be placed in an inline context/);
  });
});

describe("<H1>〜<H4>", () => {
  it("<H1> は textType: 'h1' を返す", () => {
    expect((<H1>title</H1>) as minitype.Text).toMatchObject({
      type: "text",
      textType: "h1",
    });
  });

  it("<H4> は textType: 'h4' を返す", () => {
    expect((<H4>title</H4>) as minitype.Text).toMatchObject({
      type: "text",
      textType: "h4",
    });
  });

  it("unnumbered が反映される", () => {
    expect((<H1 unnumbered>title</H1>) as minitype.Text).toMatchObject({
      unnumbered: true,
    });
  });

  it("ブロック要素を子に持つとエラーを投げる", () => {
    expect(() => (
      <H1>
        <Box />
      </H1>
    )).toThrow(/cannot be placed in an inline context/);
  });
});

describe("<Caption>，<Li1>", () => {
  it("<Caption> は textType: 'caption' を返す", () => {
    expect((<Caption>caption text</Caption>) as minitype.Text).toMatchObject({
      type: "text",
      textType: "caption",
    });
  });

  it("<Li1> は listType: 'unordered', level: 1 を返す", () => {
    expect((<Li1>item</Li1>) as minitype.List).toMatchObject({
      type: "list",
      listType: "unordered",
      level: 1,
    });
  });
});
