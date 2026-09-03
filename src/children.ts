/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type {
  Block,
  BlockExtender,
  Flow,
  Group,
  InlineOrExtender,
  TableCell,
} from "@minitype/minitype";
import {
  isBlock,
  isBlockExtender,
  isFlow,
  isGroup,
  isInline,
  isTableCell,
} from "@minitype/minitype";
import type {
  BlockChildren,
  BodyChildren,
  GroupChildren,
  InlineChildren,
  LineBreak,
  RowChildren,
  TableChildren,
} from "./jsx-runtime.js";

// ------
// 内部関数
// ------
/**
 * 値が {@link LineBreak} であるかを判定する．
 */
const isLineBreak = (value: unknown): value is LineBreak => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "br"
  );
};

/**
 * 値が JSX の children として無視すべき値（`null`，`undefined`，`true`，`false`）であるかを判定する．
 */
const isIgnored = (value: unknown): boolean => {
  return value == null || value === true || value === false;
};

/**
 * 値が {@link TableCell} の配列であるかを判定する．
 */
const isTableCellArray = (value: unknown): value is TableCell[] => {
  return Array.isArray(value) && value.length > 0 && isTableCell(value[0]);
};

/**
 * ブロック要素の識別名を返す．`textType`（`"h1"`，`"paragraph"` 等）を `type` より優先する．
 */
const blockLabel = (child: unknown): string => {
  const typed = child as { type?: string; textType?: string };
  return typed.textType ?? typed.type ?? "block element";
};

/**
 * インライン要素の識別名を返す．Command の `name`（`"b"`，`"sup"` 等）を `type` より優先する．
 */
const inlineLabel = (child: unknown): string => {
  const typed = child as { type?: string; name?: string };
  return typed.name ?? typed.type ?? "inline element";
};

/**
 * JSX の children を再帰的にフラット化して配列として返す．
 */
const flattenJsxChildren = (children: unknown): unknown[] => {
  if (isIgnored(children)) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenJsxChildren(child));
  }
  return [children];
};

// ------
// 公開 API
// ------
/**
 * JSX の children をインライン要素の行配列（Lines 相当）に変換する．
 * 文字列中の \n を行区切りとして扱う．
 */
export const collectInlineLines = (
  children: InlineChildren,
): InlineOrExtender[][] => {
  const flat = flattenJsxChildren(children);
  const lines: InlineOrExtender[][] = [[]];

  for (const child of flat) {
    if (typeof child === "number") {
      lines.at(-1)!.push(String(child));
      continue;
    }
    if (isLineBreak(child)) {
      lines.push([]);
      continue;
    }
    if (typeof child === "string") {
      const parts = child.replace(/\r\n?/g, "\n").split("\n");
      lines.at(-1)!.push(parts[0]);
      for (let i = 1; i < parts.length; i++) {
        lines.push(parts[i] ? [parts[i]] : []);
      }
      continue;
    }
    // ブロック要素はインライン要素として配置できない
    if (isBlock(child)) {
      throw new Error(
        `Invalid JSX structure: "${blockLabel(child)}" cannot be placed in an inline context.`,
      );
    }
    lines.at(-1)!.push(child as InlineOrExtender);
  }

  return lines;
};

/**
 * JSX の children をインライン要素の配列（単一行）に変換する．
 */
export const collectInlines = (
  children: InlineChildren,
): InlineOrExtender[] => {
  return collectInlineLines(children).flat();
};

/**
 * JSX の children を {@link Br} で行ごとに分割し，各行に {@link wrap} を適用して返す．
 * `<B>1行目<Br/>2行目</B>` → `[b(["1行目"]), LineBreak, b(["2行目"])]` のような変換に使用する．
 * 行が 1 つの場合は wrap の結果をそのまま返す．
 */
export const collectInlineSegments = (
  children: InlineChildren,
  wrap: (inlines: InlineOrExtender[]) => InlineOrExtender,
): InlineOrExtender | (InlineOrExtender | LineBreak)[] => {
  const lines = collectInlineLines(children);
  if (lines.length === 1) {
    return wrap(lines[0]);
  }
  const result: (InlineOrExtender | LineBreak)[] = [];
  for (let i = 0; i < lines.length; i++) {
    result.push(wrap(lines[i]));
    if (i < lines.length - 1) {
      result.push({ type: "br" });
    }
  }
  return result;
};

/**
 * JSX の children をブロック要素の配列に変換する．
 */
export const collectBlocks = (
  children: BlockChildren,
): (Block | BlockExtender)[] => {
  const flat = flattenJsxChildren(children);
  const result: (Block | BlockExtender)[] = [];

  for (const child of flat) {
    if (isIgnored(child)) {
      continue;
    }
    if (isBlock(child) || isBlockExtender(child as Block | BlockExtender)) {
      result.push(child as Block | BlockExtender);
      continue;
    }
    if (isInline(child)) {
      throw new Error(
        `Invalid JSX structure: "${inlineLabel(child)}" cannot be placed in a block context.`,
      );
    }
    throw new Error(
      "Invalid JSX structure: unexpected child in block context.",
    );
  }

  return result;
};

/**
 * JSX の children をグループ本文（Block，BlockExtender，Flow）の配列に変換する．
 * {@link Group} の children に使用する．
 */
export const collectBody = (
  children: BodyChildren,
): (Block | BlockExtender | Flow)[] => {
  const flat = flattenJsxChildren(children);
  const result: (Block | BlockExtender | Flow)[] = [];

  for (const child of flat) {
    if (isIgnored(child)) {
      continue;
    }
    if (isFlow(child)) {
      result.push(child);
      continue;
    }
    if (isBlock(child) || isBlockExtender(child as Block | BlockExtender)) {
      result.push(child as Block | BlockExtender);
      continue;
    }
    if (isInline(child)) {
      throw new Error(
        `Invalid JSX structure: "${inlineLabel(child)}" cannot be placed in a block context.`,
      );
    }
    throw new Error(
      "Invalid JSX structure: unexpected child in block context.",
    );
  }

  return result;
};

/**
 * JSX の children から最初のブロック要素を取得する．
 * {@link Cell} などの単一コンテンツ要素で使用する．
 */
export const collectSingleBlock = (children: BlockChildren): Block => {
  const blocks = collectBlocks(children);
  if (blocks.length === 0) {
    throw new Error("Expected at least one block child.");
  }
  if (blocks.length > 1) {
    throw new Error("Expected exactly one block child, but got multiple.");
  }
  const block = blocks[0];
  if (isBlockExtender(block)) {
    throw new Error("BlockExtender cannot be used as a single block child.");
  }
  return block;
};

/**
 * JSX の children を {@link Group} の配列に変換する．
 */
export const collectGroups = (children: GroupChildren): Group[] => {
  const flat = flattenJsxChildren(children);
  const result: Group[] = [];

  for (const child of flat) {
    if (isIgnored(child)) {
      continue;
    }
    if (isGroup(child)) {
      result.push(child);
      continue;
    }
    if (isBlock(child)) {
      throw new Error(
        `Invalid JSX structure: "${blockLabel(child)}" cannot be placed directly inside Document. Wrap it in a Group.`,
      );
    }
    throw new Error(
      "Invalid JSX structure: unexpected child in Document. Expected Group elements.",
    );
  }

  return result;
};

/**
 * JSX の children を {@link TableCell} の 2 次元配列に変換する．
 * {@link Row} コンポーネントは TableCell[] を返すため，flattenJsxChildren で展開せずに収集する．
 */
export const collectRows = (children: TableChildren): TableCell[][] => {
  // 単一の Row（children が TableCell[] の場合）
  if (isTableCellArray(children)) {
    return [children];
  }
  if (!Array.isArray(children)) {
    if (!isIgnored(children)) {
      throw new Error(
        "Invalid JSX structure: unexpected child in Table. Expected Row elements.",
      );
    }
    return [];
  }
  // 複数の Row（children が (TableCell[] | unknown)[] の場合）
  const rows: TableCell[][] = [];
  for (const item of children) {
    if (isIgnored(item)) {
      continue;
    }
    if (isTableCellArray(item)) {
      rows.push(item);
    } else if (Array.isArray(item)) {
      rows.push(...collectRows(item as TableChildren));
    } else {
      throw new Error(
        "Invalid JSX structure: unexpected child in Table. Expected Row elements.",
      );
    }
  }
  return rows;
};

/**
 * JSX の children を {@link TableCell} の配列に変換する．
 */
export const collectCells = (children: RowChildren): TableCell[] => {
  const flat = flattenJsxChildren(children);
  const result: TableCell[] = [];

  for (const child of flat) {
    if (isIgnored(child)) {
      continue;
    }
    if (isTableCell(child)) {
      result.push(child);
      continue;
    }
    throw new Error(
      "Invalid JSX structure: unexpected child in Row. Expected Cell elements.",
    );
  }

  return result;
};

/**
 * JSX の children を {@link Box} の配列に変換する．
 * {@link Flexbox} の子要素に使用する．
 */
export const collectBoxes = (
  children: BlockChildren,
): (Block | BlockExtender)[] => {
  const flat = flattenJsxChildren(children);
  const result: (Block | BlockExtender)[] = [];

  for (const child of flat) {
    if (isIgnored(child)) {
      continue;
    }
    const typed = child as { type?: unknown };
    if (
      typeof typed === "object" &&
      typed !== null &&
      (typed.type === "box" || typed.type === "blockExtender")
    ) {
      result.push(child as Block | BlockExtender);
      continue;
    }
    if (isBlock(child)) {
      throw new Error(
        `Invalid JSX structure: "${blockLabel(child)}" cannot be placed directly inside Flexbox. Only Box elements are allowed.`,
      );
    }
    throw new Error(
      "Invalid JSX structure: unexpected child in Flexbox. Expected Box elements.",
    );
  }

  return result;
};
