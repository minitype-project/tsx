/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { B, Br, Del, Sub, Sup, U } from "../index.js";
import type { LineBreak } from "../jsx-runtime.js";

describe("インライン装飾", () => {
  it("<B> は name: 'b' のコマンドを返す", () => {
    const result = (<B>bold</B>) as minitype.Command;
    expect(result).toMatchObject({
      type: "command",
      name: "b",
      body: ["bold"],
    });
  });

  it("<U> は name: 'u' のコマンドを返す", () => {
    expect((<U>underline</U>) as minitype.Command).toMatchObject({
      type: "command",
      name: "u",
    });
  });

  it("<Sup> は name: 'sup' のコマンドを返す", () => {
    expect((<Sup>2</Sup>) as minitype.Command).toMatchObject({
      type: "command",
      name: "sup",
    });
  });

  it("<Sub> は name: 'sub' のコマンドを返す", () => {
    expect((<Sub>2</Sub>) as minitype.Command).toMatchObject({
      type: "command",
      name: "sub",
    });
  });

  it("<Del> は name: 'del' のコマンドを返す", () => {
    expect((<Del>deleted</Del>) as minitype.Command).toMatchObject({
      type: "command",
      name: "del",
    });
  });

  it("<B> 内の <Br/> で複数セグメントを返す", () => {
    const result = (
      <B>
        line1
        <Br />
        line2
      </B>
    ) as (minitype.InlineOrExtender | LineBreak)[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      type: "command",
      name: "b",
      body: ["line1"],
    });
    expect(result[1]).toEqual({ type: "br" });
    expect(result[2]).toMatchObject({
      type: "command",
      name: "b",
      body: ["line2"],
    });
  });
});
