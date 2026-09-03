# @minitype/tsx

[minitype](https://typeset.jp) の JSX/TSX サポートパッケージです．
JSX 記法を用いた minitype の文書記述を実現するコンポーネント群および JSX ランタイムを提供します．

**@minitype/tsx** is a JSX/TSX support package for [minitype](https://typeset.jp).
It provides a set of components and a JSX runtime for writing typesetting documents in JSX syntax.

[コンポーネント一覧](./docs/component.md) – [開発ガイド](./docs/development.md)

## セットアップ

1. `@minitype/tsx` をインストールします．

```bash
# npm
npm install @minitype/tsx

# Yarn
yarn add @minitype/tsx
```

2. `tsconfig.json` に JSX の設定を追加します．

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@minitype/tsx"
  }
}
```

## 使い方

`.tsx` ファイルに JSX を使って組版ドキュメントを記述します．
`<Document>` をルート要素として，その中に `<Group>`（グループ）を配置します．
グループの中にブロック要素を配置して，ブロック要素の中にインライン要素を配置します．
最後に `minitypeJSX()` へ渡すことで PDF を出力します．

詳細なコンポーネントについては [コンポーネント一覧](./docs/component.md) を，実際の使用例については [sample/index.tsx](./sample/index.tsx) を参照してください．

```tsx
import { cmyk } from "@minitype/minitype";
import {
  B, Caption, Cell, Code, Color, Document, Fn, Footnote, Group,
  H1, H2, Image, Li1, Li2, MathBlock, minitypeJSX,
  Ol1, Ol2, P, Row, Ruby, Table, Url,
} from "@minitype/tsx";

const document = (
  <Document style={{ size: { width: 210, height: 297 }, writingMode: "horizontal" }}>
    <Group>
      <H1>minitype</H1>

      <H2>テキストとインライン要素</H2>
      <P>
        minitype は PDF 組版エンジンです<Fn label="fn-1" />．
        <B>太字</B>や<Color value={cmyk(0, 100, 100, 0)}>赤色テキスト</Color>，
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
          <Cell><P>名前</P></Cell>
          <Cell><P>説明</P></Cell>
        </Row>
        <Row>
          <Cell><P>minitype</P></Cell>
          <Cell><P>PDF 組版エンジン</P></Cell>
        </Row>
      </Table>

      <H2>画像とキャプション</H2>
      <Image src="figure.png" style={{ width: 80 }} />
      <Caption>サンプル画像</Caption>
    </Group>
  </Document>
);

await minitypeJSX(document, { fontDir: "./fonts" }).save("output.pdf");
```

## ライセンス・謝辞

Copyright (c) 2026 Yuto Wada.
This software is released under the MIT License, see [LICENSE](./LICENSE).

本ソフトウェアは，2025 年度下期 未踏アドバンスト事業の支援を受けて開発されました．

- [未踏アドバンスト事業：2025年度下期実施プロジェクト概要（和田PJ）](https://www.ipa.go.jp/jinzai/mitou/advanced/2025second/gaiyou-fj-1.html)
