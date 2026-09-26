import { cmyk, em, fill, fr, physical, Q } from "@minitype/minitype";
import type { InlineChildren } from "@minitype/tsx";
import {
  Box,
  Caption,
  Cell,
  Code,
  Color,
  Document,
  evaluateMdxFile,
  Fn,
  Footnote,
  Group,
  H1,
  Image,
  Li2,
  MathBlock,
  minitypeJSX,
  Ol2,
  P,
  Row,
  Ruby,
  Table,
} from "@minitype/tsx";

// ------
// 補完コンポーネント
// ------

const RedText = ({ children }: { children?: InlineChildren }) =>
  Color({ value: cmyk(0, 100, 100, 0), children });

const KumihanRuby = ({ children }: { children?: string }) =>
  Ruby({ ruby: "くみはん", children: children ?? "" });

const CodeBox = ({ children }: { children?: InlineChildren }) =>
  Box({
    style: {
      background: [fill(cmyk(0, 0, 0, 6))],
      padding: physical(3, 4),
    },
    children: Code({ children, lang: "ts" }),
  });

const SampleTable = () =>
  Table({
    style: {
      columnWidths: [fr(1), fr(3)],
      cellPadding: physical(2, 4),
      textStyle: (rowIndex) =>
        rowIndex === 0 ? { font: "SourceHanSansJP-Bold" } : {},
    },
    children: [
      Row({
        children: [
          Cell({ children: P({ children: "名前" }) }),
          Cell({ children: P({ children: "説明" }) }),
        ],
      }),
      Row({
        children: [
          Cell({ children: P({ children: "minitype" }) }),
          Cell({ children: P({ children: "PDF 組版エンジン" }) }),
        ],
      }),
    ],
  });

const SampleImage = () => Image({ src: "figure.png", style: { width: 80 } });

// ------
// 組版処理
// ------

const result = await evaluateMdxFile(
  new URL("content.mdx", import.meta.url).pathname,
  {
    components: {
      H1,
      Fn,
      Footnote,
      Li2,
      Ol2,
      MathBlock,
      Caption,
      RedText,
      KumihanRuby,
      CodeBox,
      SampleTable,
      SampleImage,
    },
  },
);

const document = (
  <Document
    style={{
      size: "A4",
      writingMode: "horizontal",
      padding: physical(25, 25),
      block: {
        paragraph: {
          size: Q(16),
          firstIndent: em(1),
          lineHeight: em(1.6),
        },
        h1: {
          size: Q(24),
          font: "SourceHanSansJP-Bold",
          align: "center",
        },
        h2: {
          size: Q(20),
          font: "SourceHanSansJP-Bold",
        },
        code: {
          font: "SourceCodePro-Regular",
        },
        caption: {
          size: Q(14),
          font: "SourceHanSansJP-Regular",
          align: "center",
        },
      },
      gaps: [
        ["h1", "fallback", 8],
        ["h2", "fallback", 4],
        ["fallback", "h2", 8],
        ["paragraph", "paragraph", 2],
        ["fallback", "fallback", 4],
      ],
    }}
  >
    <Group>{result.blocks}</Group>
  </Document>
);

await minitypeJSX(document, { fontDir: "./fonts" }).save("output-mdx.pdf");
console.log("Saved to output-mdx.pdf");
