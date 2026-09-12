/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { Group, H1, P } from "../index.js";

describe("Fragment のネスト配列フラット化", () => {
  it("配列変数を {} で埋め込むとフラット化される", () => {
    const sub = (
      <>
        <P>a</P>
        <P>b</P>
      </>
    ) as unknown as minitype.Block[];

    const result = (
      <>
        <P>before</P>
        {sub}
        <P>after</P>
      </>
    ) as unknown as minitype.Block[];

    expect(result).toHaveLength(4);
    expect((result[0] as minitype.Text).lines).toEqual([["before"]]);
    expect((result[1] as minitype.Text).lines).toEqual([["a"]]);
    expect((result[2] as minitype.Text).lines).toEqual([["b"]]);
    expect((result[3] as minitype.Text).lines).toEqual([["after"]]);
  });

  it("複数の配列変数を連続して埋め込める", () => {
    const sub1 = (
      <>
        <P>1</P>
        <P>2</P>
      </>
    ) as unknown as minitype.Block[];
    const sub2 = (
      <>
        <P>3</P>
        <P>4</P>
      </>
    ) as unknown as minitype.Block[];

    const result = (
      <>
        {sub1}
        {sub2}
      </>
    ) as unknown as minitype.Block[];

    expect(result).toHaveLength(4);
  });

  it("深くネストした Fragment もフラット化される", () => {
    const inner = (
      <>
        <P>x</P>
      </>
    ) as unknown as minitype.Block[];
    const outer = (<>{inner}</>) as unknown as minitype.Block[];

    const result = (<>{outer}</>) as unknown as minitype.Block[];

    expect(result).toHaveLength(1);
    expect((result[0] as minitype.Text).lines).toEqual([["x"]]);
  });

  it("{null}/{false} はフラット化後も無視される", () => {
    const sub = (
      <>
        <P>visible</P>
      </>
    ) as unknown as minitype.Block[];

    const result = (
      <>
        {null}
        {sub}
        {false}
      </>
    ) as unknown as minitype.Block[];

    expect(result).toHaveLength(1);
  });
});

describe("関数コンポーネントの {} 埋め込み", () => {
  it("関数コンポーネントを {} で埋め込むと呼び出されてフラット化される", () => {
    const Sub = () => (
      <>
        <P>a</P>
        <P>b</P>
      </>
    );

    const result = (
      <>
        <P>before</P>
        {Sub}
        <P>after</P>
      </>
    ) as unknown as minitype.Block[];

    expect(result).toHaveLength(4);
    expect((result[1] as minitype.Text).lines).toEqual([["a"]]);
    expect((result[2] as minitype.Text).lines).toEqual([["b"]]);
  });

  it("複数の関数コンポーネントを連続して埋め込める", () => {
    const Sub1 = () => (
      <>
        <P>1</P>
        <P>2</P>
      </>
    );
    const Sub2 = () => (
      <>
        <P>3</P>
      </>
    );

    const result = (
      <>
        {Sub1}
        {Sub2}
      </>
    ) as unknown as minitype.Block[];

    expect(result).toHaveLength(3);
  });

  it("関数コンポーネントが単一ブロックを返す場合も動作する", () => {
    const Sub = () => <P>single</P>;

    const result = (<>{Sub}</>) as unknown as minitype.Block[];

    expect(result).toHaveLength(1);
    expect((result[0] as minitype.Text).lines).toEqual([["single"]]);
  });

  it("{Sub} と <Sub /> で同じ結果になる", () => {
    const Sub = () => (
      <>
        <H1>heading</H1>
        <P>body</P>
      </>
    );

    const withBrace = (<>{Sub}</>) as unknown as minitype.Block[];

    const withTag = (
      <>
        <Sub />
      </>
    ) as unknown as minitype.Block[];

    expect(withBrace).toEqual(withTag);
  });
});

describe("<Group> 内でのフラット化", () => {
  it("Fragment を Group の子として埋め込める", () => {
    const sub = (
      <>
        <P>a</P>
        <P>b</P>
      </>
    ) as unknown as minitype.Block[];

    const result = (
      <Group>
        <P>before</P>
        {sub}
        <P>after</P>
      </Group>
    ) as minitype.Group;

    expect(result.body).toHaveLength(4);
  });
});
