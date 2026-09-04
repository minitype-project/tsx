import type * as minitype from "@minitype/minitype";
import { describe, expect, it } from "vitest";
import { B, Document, Flow, Group, P } from "../index.js";
import type { DocumentResult } from "../jsx-runtime.js";

describe("<Group>，<Document>", () => {
  it("<Group> はブロック要素を body に収集する", () => {
    const result = (
      <Group>
        <P>text</P>
      </Group>
    ) as minitype.Group;
    expect(result).toMatchObject({ body: [{ type: "text" }] });
  });

  it("<Document> は groups を返す", () => {
    const result = (
      <Document>
        <Group>
          <P>text</P>
        </Group>
      </Document>
    ) as DocumentResult;
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toMatchObject({ body: [{ type: "text" }] });
  });

  it("<Document> 直下にブロックを置くとエラーを投げる", () => {
    expect(() => (
      <Document>
        <P>text</P>
      </Document>
    )).toThrow(/cannot be placed directly inside Document/);
  });

  it("<Group> 内にインライン要素を置くとエラーを投げる", () => {
    expect(() => (
      <Group>
        <B>text</B>
      </Group>
    )).toThrow(/cannot be placed in a block context/);
  });
});

describe("<Group> の <Flow> 収集", () => {
  it("<Flow> を body に収集する", () => {
    const result = (
      <Group>
        <P>text</P>
        <Flow position="pillar">
          <P>header</P>
        </Flow>
      </Group>
    ) as minitype.Group;
    expect(result.body).toHaveLength(2);
    expect(result.body[1]).toMatchObject({ type: "flow", position: "pillar" });
  });

  it("<Flow> のみを body に収集する", () => {
    const result = (
      <Group>
        <Flow position="nombre">
          <P>footer</P>
        </Flow>
      </Group>
    ) as minitype.Group;
    expect(result.body).toHaveLength(1);
    expect(result.body[0]).toMatchObject({ type: "flow", position: "nombre" });
  });
});
