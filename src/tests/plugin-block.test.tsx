import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { Dd, Description, Dt, Easytable, P, Td, Tr } from "../index.js";

describe("<Description>，<Dt>，<Dd>", () => {
  it("Dt + Dd のペアを収集する", () => {
    const result = (
      <Description>
        <Dt>term</Dt>
        <Dd>body</Dd>
      </Description>
    ) as minitype.Text[];
    expect(Array.isArray(result)).toBe(true);
  });

  it("複数の Dt + Dd ペアを収集する", () => {
    const result = (
      <Description>
        <Dt>term1</Dt>
        <Dd>body1</Dd>
        <Dt>term2</Dt>
        <Dd>body2</Dd>
      </Description>
    ) as minitype.Text[];
    expect(Array.isArray(result)).toBe(true);
  });

  it("Dt が連続するとエラーを投げる", () => {
    expect(() => (
      <Description>
        <Dt>term1</Dt>
        <Dt>term2</Dt>
        <Dd>body</Dd>
      </Description>
    )).toThrow(/Dt must be followed by Dd/);
  });

  it("Dd が先行する Dt なしで出現するとエラーを投げる", () => {
    expect(() => (
      <Description>
        <Dd>body</Dd>
      </Description>
    )).toThrow(/Dd must be preceded by a Dt/);
  });

  it("Dt で終わるとエラーを投げる", () => {
    expect(() => (
      <Description>
        <Dt>term</Dt>
      </Description>
    )).toThrow(/Dt at end of Description/);
  });

  it("想定外の子要素を渡すとエラーを投げる", () => {
    expect(() => (
      <Description>
        <P>text</P>
      </Description>
    )).toThrow(/Invalid JSX structure/);
  });
});

describe("<Easytable>，<Tr>，<Td>", () => {
  it("Easytable 構造全体を生成する", () => {
    const result = (
      <Easytable>
        <Tr>
          <Td>A</Td>
          <Td>B</Td>
        </Tr>
      </Easytable>
    ) as minitype.Table | minitype.Box;
    expect(result).toBeDefined();
  });

  it("複数行の Easytable を生成する", () => {
    const result = (
      <Easytable>
        <Tr>
          <Td>R1C1</Td>
        </Tr>
        <Tr>
          <Td>R2C1</Td>
        </Tr>
      </Easytable>
    ) as minitype.Table | minitype.Box;
    expect(result).toBeDefined();
  });

  it("<Tr> に <Td> 以外を配置するとエラーを投げる", () => {
    expect(() => (
      <Tr>
        <P>text</P>
      </Tr>
    )).toThrow(/Invalid JSX structure/);
  });

  it("<Easytable> に <Tr> 以外を配置するとエラーを投げる", () => {
    expect(() => (
      <Easytable>
        <Td>cell</Td>
      </Easytable>
    )).toThrow(/Invalid JSX structure/);
  });
});
