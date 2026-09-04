import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { Cell, LstInputlisting, P, Row, Table } from "../index.js";

describe("<Table>，<Row>，<Cell>", () => {
  it("テーブル構造全体を生成する", () => {
    const result = (
      <Table>
        <Row>
          <Cell>
            <P>A</P>
          </Cell>
          <Cell>
            <P>B</P>
          </Cell>
        </Row>
      </Table>
    ) as minitype.Table;
    expect(result.type).toBe("table");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveLength(2);
    expect(result.rows[0][0]).toMatchObject({ type: "tableCell" });
  });

  it("複数行のテーブルを生成する", () => {
    const result = (
      <Table>
        <Row>
          <Cell>
            <P>R1C1</P>
          </Cell>
        </Row>
        <Row>
          <Cell>
            <P>R2C1</P>
          </Cell>
        </Row>
      </Table>
    ) as minitype.Table;
    expect(result.rows).toHaveLength(2);
  });

  it("<Cell> の子が 0 個のときエラーを投げる", () => {
    expect(() => <Cell />).toThrow(/at least one/);
  });

  it("<Cell> の子が複数のときエラーを投げる", () => {
    expect(() => (
      <Cell>
        <P>a</P>
        <P>b</P>
      </Cell>
    )).toThrow(/exactly one/);
  });

  it("<Cell> の子が BlockExtender のときエラーを投げる", () => {
    expect(() => (
      <Cell>
        <LstInputlisting src="file.ts" />
      </Cell>
    )).toThrow(/BlockExtender cannot be used/);
  });

  it("<Row> に <Cell> 以外を配置するとエラーを投げる", () => {
    expect(() => (
      <Row>
        <P>text</P>
      </Row>
    )).toThrow(/Invalid JSX structure/);
  });
});
