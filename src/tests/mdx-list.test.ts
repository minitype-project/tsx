/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type * as minitype from "@minitype/minitype";
import { li1, li2, li3, ol1, ol2, ol3, p } from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { evaluateMdxString } from "../mdx.js";

const getBox = async (md: string): Promise<minitype.Box> => {
  const { blocks } = await evaluateMdxString(md);
  // MDX は単一トップレベル要素のとき Fragment を使わず直接返すため，
  // blocks が配列になるかどうかは要素数に依存する
  if (Array.isArray(blocks)) {
    return (blocks as minitype.Block[])[0] as minitype.Box;
  }
  return blocks as minitype.Box;
};

describe("順序なしリスト", () => {
  it("ネストのない項目を li1 に変換できる", async () => {
    const box = await getBox(`
- item1
- item2
`);
    expect(box.type).toBe("box");
    expect(box.style).toMatchObject({ gapRole: "list", splitable: true });
    expect(box.blocks).toHaveLength(2);
    expect(box.blocks[0]).toMatchObject(li1("item1"));
    expect(box.blocks[1]).toMatchObject(li1("item2"));
  });

  it("2 段ネストされた項目を li1, li2 に変換できる", async () => {
    const box = await getBox(`
- item1
  - item2
`);
    expect(box.blocks).toHaveLength(2);
    expect(box.blocks[0]).toMatchObject(li1("item1"));
    expect(box.blocks[1]).toMatchObject(li2("item2"));
  });

  it("3 段ネストされた項目を li1, li2, li3 に変換できる", async () => {
    const box = await getBox(`
- item1
  - item2
    - item3
`);
    expect(box.blocks).toHaveLength(3);
    expect(box.blocks[0]).toMatchObject(li1("item1"));
    expect(box.blocks[1]).toMatchObject(li2("item2"));
    expect(box.blocks[2]).toMatchObject(li3("item3"));
  });
});

describe("ol のリスト変換", () => {
  it("ネストのない項目を ol1 に変換できる", async () => {
    const box = await getBox(`
1. item1
2. item2
`);
    expect(box.type).toBe("box");
    expect(box.style).toMatchObject({ gapRole: "list", splitable: true });
    expect(box.blocks).toHaveLength(2);
    expect(box.blocks[0]).toMatchObject(ol1("item1"));
    expect(box.blocks[1]).toMatchObject(ol1("item2"));
  });

  it("2 段ネストされた要素を ol1, ol2 に変換できる", async () => {
    const box = await getBox(`
1. item1
   1. item2
`);
    expect(box.blocks).toHaveLength(2);
    expect(box.blocks[0]).toMatchObject(ol1("item1"));
    expect(box.blocks[1]).toMatchObject(ol2("item2"));
  });

  it("3 段ネストされた項目を ol1, ol2, ol3 に変換できる", async () => {
    const box = await getBox(`
1. item1
   1. item2
      1. item3
`);
    expect(box.blocks).toHaveLength(3);
    expect(box.blocks[0]).toMatchObject(ol1("item1"));
    expect(box.blocks[1]).toMatchObject(ol2("item2"));
    expect(box.blocks[2]).toMatchObject(ol3("item3"));
  });
});

describe("ネストリスト（混合）", () => {
  it("ol の中の ul を変換できる", async () => {
    const box = await getBox(`
1. item1
   - item2
   - item3
2. item4
`);
    expect(box.blocks).toHaveLength(4);
    expect(box.blocks[0]).toMatchObject(ol1("item1"));
    expect(box.blocks[1]).toMatchObject(li2("item2"));
    expect(box.blocks[2]).toMatchObject(li2("item3"));
    expect(box.blocks[3]).toMatchObject(ol1("item4"));
  });

  it("ul の中の ol を変換できる", async () => {
    const box = await getBox(`
- item1
  1. item2
  2. item3
- item4
`);
    expect(box.blocks).toHaveLength(4);
    expect(box.blocks[0]).toMatchObject(li1("item1"));
    expect(box.blocks[1]).toMatchObject(ol2("item2"));
    expect(box.blocks[2]).toMatchObject(ol2("item3"));
    expect(box.blocks[3]).toMatchObject(li1("item4"));
  });
});

describe("複数のリスト", () => {
  it("空行で区切られた順序なしリストが別々の Box になる", async () => {
    const { blocks } = await evaluateMdxString(`
- item1

- item2

- item3
`);
    const result = blocks as minitype.Block[];
    expect(result).toHaveLength(3);
    expect((result[0] as minitype.Box).blocks[0]).toMatchObject(li1("item1"));
    expect((result[1] as minitype.Box).blocks[0]).toMatchObject(li1("item2"));
    expect((result[2] as minitype.Box).blocks[0]).toMatchObject(li1("item3"));
  });

  it("空行で区切られた順序付きリストが別々の Box になる", async () => {
    const { blocks } = await evaluateMdxString(`
1. item1

1. item2

1. item3
`);
    const result = blocks as minitype.Block[];
    expect(result).toHaveLength(3);
    expect((result[0] as minitype.Box).blocks[0]).toMatchObject(ol1("item1"));
    expect((result[1] as minitype.Box).blocks[0]).toMatchObject(ol1("item2"));
    expect((result[2] as minitype.Box).blocks[0]).toMatchObject(ol1("item3"));
  });

  it("テキストを挟んだ順序付きリストが別々の Box になる", async () => {
    const { blocks } = await evaluateMdxString(`
1. first

paragraph

1. last
`);
    const result = blocks as minitype.Block[];
    expect(result).toHaveLength(3);
    expect((result[0] as minitype.Box).blocks[0]).toMatchObject(ol1("first"));
    expect(result[1]).toMatchObject(p("paragraph"));
    expect((result[2] as minitype.Box).blocks[0]).toMatchObject(ol1("last"));
  });

  it("複雑な複数のリストを処理できる", async () => {
    // 手順リストのよくある使い方: 空行区切りの ol が分割され，
    // サブ項目を持つ手順のみ Box 内に複数ブロックが入る
    const { blocks } = await evaluateMdxString(`
- 項目 1
  - サブ項目 A
  - サブ項目 B

- 項目 2
   1. サブの順序付き項目 A
   2. サブの順序付き項目 B

1. 順序付き項目 1
2. 順序付き項目 2
`);
    const result = blocks as minitype.Block[];
    expect(result).toHaveLength(3);

    const step1 = result[0] as minitype.Box;
    expect(step1.blocks).toHaveLength(3);
    expect(step1.blocks[0]).toMatchObject(li1("項目 1"));
    expect(step1.blocks[1]).toMatchObject(li2("サブ項目 A"));
    expect(step1.blocks[2]).toMatchObject(li2("サブ項目 B"));

    const step2 = result[1] as minitype.Box;
    expect(step2.blocks).toHaveLength(3);
    expect(step2.blocks[0]).toMatchObject(li1("項目 2"));
    expect(step2.blocks[1]).toMatchObject(ol2("サブの順序付き項目 A"));
    expect(step2.blocks[2]).toMatchObject(ol2("サブの順序付き項目 B"));

    const step3 = result[2] as minitype.Box;
    expect(step3.blocks).toHaveLength(2);
    expect(step3.blocks[0]).toMatchObject(ol1("順序付き項目 1"));
    expect(step3.blocks[1]).toMatchObject(ol1("順序付き項目 2"));
  });
});
