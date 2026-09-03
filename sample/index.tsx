import { cmyk } from "@minitype/minitype";
import {
  B,
  Caption,
  Cell,
  Code,
  Color,
  Document,
  Fn,
  Footnote,
  Group,
  H1,
  H2,
  Image,
  Li1,
  Li2,
  MathBlock,
  minitypeJSX,
  Ol1,
  Ol2,
  P,
  Row,
  Ruby,
  Table,
  Url,
} from "@minitype/tsx";

const document = (
  <Document
    style={{ size: { width: 210, height: 297 }, writingMode: "horizontal" }}
  >
    <Group>
      <H1>minitype</H1>

      <H2>テキストとインライン要素</H2>
      <P>
        minitype は PDF 組版エンジンです
        <Fn label="fn-1" />．<B>太字</B>や
        <Color value={cmyk(0, 100, 100, 0)}>赤色テキスト</Color>，
        <Ruby ruby="くみはん">組版</Ruby>等のインライン要素を使用できます．
        詳細は<Url href="https://typeset.jp">公式サイト</Url>をご覧ください．
      </P>
      <Footnote label="fn-1">
        Node.js 上で動作して，PDF を直接出力します．
      </Footnote>

      <H2>リスト</H2>
      <Li1>順序なしリスト（第 1 レベル）</Li1>
      <Li2>順序なしリスト（第 2 レベル）</Li2>
      <Ol1>順序付きリスト（第 1 項目）</Ol1>
      <Ol2>順序付きリスト（第 2 レベル）</Ol2>

      <H2>コードブロック，数式</H2>
      <Code lang="ts">const result = minitypeJSX(document);</Code>
      <MathBlock>{"E = mc^2"}</MathBlock>

      <H2>テーブル</H2>
      <Table>
        <Row>
          <Cell>
            <P>名前</P>
          </Cell>
          <Cell>
            <P>説明</P>
          </Cell>
        </Row>
        <Row>
          <Cell>
            <P>minitype</P>
          </Cell>
          <Cell>
            <P>PDF 組版エンジン</P>
          </Cell>
        </Row>
      </Table>

      <H2>画像とキャプション</H2>
      <Image src="figure.png" style={{ width: 80 }} />
      <Caption>サンプル画像</Caption>
    </Group>
  </Document>
);

await minitypeJSX(document, { fontDir: "./fonts" }).save("output.pdf");
console.log("Saved to output.pdf");
