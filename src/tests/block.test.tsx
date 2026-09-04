import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { B, Box, Flexbox, P, Section } from "../index.js";

describe("<Box>", () => {
  it("ブロック要素を blocks に収集する", () => {
    const result = (
      <Box>
        <P>text</P>
      </Box>
    ) as minitype.Box;
    expect(result).toMatchObject({
      type: "box",
      blocks: [{ type: "text", textType: "paragraph" }],
    });
  });

  it("複数ブロックを収集する", () => {
    const result = (
      <Box>
        <P>a</P>
        <P>b</P>
      </Box>
    ) as minitype.Box;
    expect(result.blocks).toHaveLength(2);
  });

  it("{null} を無視する", () => {
    const result = (
      <Box>
        {null}
        <P>text</P>
      </Box>
    ) as minitype.Box;
    expect(result.blocks).toHaveLength(1);
  });

  it("文字列を子に持つとエラーを投げる", () => {
    expect(() => <Box>hello</Box>).toThrow(
      /cannot be placed in a block context/,
    );
  });

  it("インライン要素を子に持つとエラーを投げる", () => {
    expect(() => (
      <Box>
        <B>text</B>
      </Box>
    )).toThrow(/cannot be placed in a block context/);
  });
});

describe("<Section>", () => {
  it("ブロック要素を blocks に収集する", () => {
    const result = (
      <Section>
        <P>text</P>
      </Section>
    ) as minitype.Section;
    expect(result).toMatchObject({
      type: "section",
      blocks: [{ type: "text" }],
    });
  });

  it("インライン要素を子に持つとエラーを投げる", () => {
    expect(() => (
      <Section>
        <B>text</B>
      </Section>
    )).toThrow(/cannot be placed in a block context/);
  });
});

describe("<Flexbox>", () => {
  it("<Box> 要素を boxes に収集する", () => {
    const result = (
      <Flexbox>
        <Box />
      </Flexbox>
    ) as minitype.Flexbox;
    expect(result).toMatchObject({ type: "flexbox", boxes: [{ type: "box" }] });
  });

  it("複数の <Box> を収集する", () => {
    const result = (
      <Flexbox>
        <Box />
        <Box />
      </Flexbox>
    ) as minitype.Flexbox;
    expect(result.boxes).toHaveLength(2);
  });

  it("<Box> 以外のブロックを配置するとエラーを投げる", () => {
    expect(() => (
      <Flexbox>
        <P>text</P>
      </Flexbox>
    )).toThrow(/Only Box elements are allowed/);
  });

  it("インライン要素を配置するとエラーを投げる", () => {
    expect(() => (
      <Flexbox>
        <B>text</B>
      </Flexbox>
    )).toThrow(/Invalid JSX structure/);
  });
});

describe("条件付きレンダリング", () => {
  it("{condition && <P>} で condition が false のとき何も表示しない", () => {
    const show = false;
    const result = (<Box>{show && <P>hidden</P>}</Box>) as minitype.Box;
    expect(result.blocks).toHaveLength(0);
  });

  it("{condition && <P>} で condition が true のとき表示する", () => {
    const show = true;
    const result = (<Box>{show && <P>visible</P>}</Box>) as minitype.Box;
    expect(result.blocks).toHaveLength(1);
  });

  it("三項演算子で分岐したブロックを収集する", () => {
    const flag = true;
    const result = (<Box>{flag ? <P>yes</P> : <P>no</P>}</Box>) as minitype.Box;
    expect((result.blocks[0] as minitype.Text).lines).toEqual([["yes"]]);
  });
});
