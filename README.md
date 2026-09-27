# @minitype/tsx

[minitype](https://typeset.jp) の文書を JSX/TSX または Markdown + JSX/TSX（MDX）で記述するためのパッケージです．
JSX/MDX ランタイムと，ブロック・インライン・標準プラグインに対応するコンポーネント群を提供します．

**@minitype/tsx** is a JSX/TSX and Markdown + JSX/TSX (MDX) support package for [minitype](https://typeset.jp).
It provides a set of components and a JSX/MDX runtime for writing typesetting documents in JSX/MDX syntax.

- [コンポーネント一覧（ドキュメント，ブロック）](./docs/components/document-block.md)
- [コンポーネント一覧（インライン）](./docs/components/inline.md)
- [コンポーネント一覧（プラグイン／ブロック）](./docs/components/plugin-block.md)
- [コンポーネント一覧（プラグイン／インライン）](./docs/components/plugin-inline.md)
- [Markdown における改行](./docs/md-line-break.md)
- [開発ガイド](./docs/development.md)

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

## JSX での文書記述

`.tsx` ファイルに JSX を使用して文書を記述します．

`<Document>` をルート要素として，その中に `<Group>`（グループ）を配置します．
グループの中にブロック要素を配置して，ブロック要素の中にインライン要素を配置します．

最後に `minitypeJSX()` へ渡すことで PDF を出力します．
`minitypeJSX` の第 2 引数（`MiniTypeOptions`）および返り値は通常の `minitype` 関数と同一です．

詳細なコンポーネントについては [コンポーネントに関するドキュメント](./docs/components/) を，実際の使用例については [sample/index.tsx](./sample/index.tsx) を参照してください．

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

## MDX での記述

`.mdx` ファイルに Markdown と JSX を混在させて文書を記述することもできます．
`evaluateMdxFile()`（ファイルパスから読み込む場合）または `evaluateMdxString()`（文字列から評価する場合）を用いて MDX を評価して，返り値の `blocks` を `<Group>` 内に配置します．

以下の Markdown 記法に対応しています．
改行の扱いに関しては [Markdown における改行](./docs/md-line-break.md) を参照してください．

- 見出し（`#`–`####`）
- 段落，太字，斜体，取り消し線，リンク
- コードブロック，テーブル，引用
- リスト（順序なし／順序付き）<br />
  インデントによる 3 段階のネストに対応しています（順序なし：`Li1`–`Li3`，順序付き：`Ol1`–`Ol3`）．
  空行で区切られたリストは項目ごとに独立した `Box`（`gapRole: "list"`）囲まれて変換されます．
- 画像<br />
  `![alt](path)` の形式で記述します．
  `alt` を指定するとキャプション付きの図として出力されます．
  `path` の末尾に`?ratio=0.5` のようなクエリパラメータを付与した場合，全体幅に対する表示幅の比率を指定できます（既定値：`1.0`）．<br />
  （例：`![図 1](figure.png?ratio=0.5)`）
- 数式<br />
  インライン数式は `$E = mc^2$`，ブロック数式は `$$E = mc^2$$` の形式で記述します．
- 脚注，YAML フロントマター

MDX ファイル内では，デフォルトコンポーネントに加えて `<Ruby>`，`<Color>` 等の minitype-tsx コンポーネントを JSX タグとして直接使用できます．
カスタムコンポーネントを追加したい場合は，`components` オプションに渡します．

```ts
import { evaluateMdxFile, Document, Group, minitypeJSX } from "@minitype/tsx";

const result = await evaluateMdxFile("content.mdx", {
  components: {
    // カスタムコンポーネントを追加
    MyComponent: (props) => /* ... */,
  },
});

// result.frontmatter には YAML フロントマターの内容が入る
// result.blocks を <Group> に渡す
const document = (
  <Document style={{ size: "A4", writingMode: "horizontal" }}>
    <Group>{result.blocks}</Group>
  </Document>
);

await minitypeJSX(document, { fontDir: "./fonts" }).save("output.pdf");
```

実際の使用例は [sample/mdx.tsx](./sample/mdx.tsx) および [sample/content.mdx](./sample/content.mdx) を参照してください．

## ライセンス・謝辞

Copyright (c) 2026 Yuto Wada.
This software is released under the MIT License, see [LICENSE](./LICENSE).

本ソフトウェアは，2025 年度下期 未踏アドバンスト事業の支援を受けて開発されました．

- [未踏アドバンスト事業：2025年度下期実施プロジェクト概要（和田PJ）](https://www.ipa.go.jp/jinzai/mitou/advanced/2025second/gaiyou-fj-1.html)
