# @minitype/tsx

[minitype](https://typeset.jp) の JSX/TSX サポートパッケージです．
JSX 記法を用いた minitype の文書記述を実現ようコンポーネント群および JSX ランタイムを提供します．

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

```tsx
import minitype from "@minitype/minitype";
import {
  B, Caption, Cell, Code, Color, Document,
  Footnote, Fn, Group, H1, H2, Image,
  Li1, Math, Ol1, P, Row, Ruby, Table, Url,
} from "@minitype/tsx";

const { groups, style } = (
  <Document style={{ size: { width: 210, height: 297 }, writingMode: "horizontal-tb" }}>
    <Group>
      <H1>minitype</H1>

      <H2>テキストとインライン要素</H2>
      <P>
        minitype は PDF 組版エンジンです<Fn label="fn-1" />．
        <B>太字</B>や<Color value="#c00">赤色テキスト</Color>，
        <Ruby ruby="くみはん">組版</Ruby>などのインライン要素を使用できます．
        詳細は<Url href="https://typeset.jp">公式サイト</Url>をご覧ください．
      </P>
      <Footnote label="fn-1">
        Node.js 上で動作し，PDF を直接出力します．
      </Footnote>

      <H2>リスト</H2>
      <Li1>順序なしリスト・第 1 レベル</Li1>
      <Li1>JSX 記法でネストも自然に書ける</Li1>
      <Ol1>順序付きリスト・第 1 項目</Ol1>
      <Ol1>順序付きリスト・第 2 項目</Ol1>

      <H2>コードブロックと数式</H2>
      <Code lang="ts">{`const result = minitype(groups, style);`}</Code>
      <Math>{String.raw`E = mc^2`}</Math>

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
      <Caption>図 1：サンプル画像</Caption>
    </Group>
  </Document>
);

minitype(groups, style);
```

## ライセンス・謝辞

Copyright (c) 2026 Yuto Wada.
This software is released under the MIT License, see [LICENSE](./LICENSE).

本ソフトウェアは，2025 年度下期 未踏アドバンスト事業の支援を受けて開発されました．

- [未踏アドバンスト事業：2025年度下期実施プロジェクト概要（和田PJ）](https://www.ipa.go.jp/jinzai/mitou/advanced/2025second/gaiyou-fj-1.html)
