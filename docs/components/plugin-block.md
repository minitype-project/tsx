# コンポーネント一覧（プラグイン，ブロック）

minitype の組み込みプラグインをブロックコンポーネントとして使用できる．

## 図版

### `<Figure>`

図版とキャプションをセットで配置する．
`children` がキャプションとして扱われる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | 画像ファイルのパス． |
| `style?` | `Omit<FigureStyle, "label">` | 図版スタイル．`FigureStyle` の `label` を除くフィールドを指定する．`label` はトップレベルの `label` prop に指定する． |
| `label?` | `string` | 相互参照で用いるラベル． |
| `children?` | `InlineChildren` | 子要素（キャプション，インライン）． |

```tsx
<Figure src="./image.png" label="fig-1" style={{ align: "center" }}>
  図のキャプション．
</Figure>
```

## コードブロック

### `<Lstlisting>`

行番号つきのコードブロックを生成する．
`children` がコードの内容として扱われる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（コード文字列）． |
| `lang?` | `string` | シンタックスハイライトに使用する言語名． |
| `title?` | `string` | タイトルバーに表示するテキスト．省略時はタイトルバーを表示しない． |
| `firstLine?` | `number` | 表示を開始するソース上の行番号（1-based）． |
| `lastLine?` | `number` | 表示を終了するソース上の行番号（1-based，指定した行を含む）． |
| `firstDisplayNumber?` | `number` | 行番号として最初に表示される番号． |
| `showLineNumbers?` | `boolean` | 行番号を表示するかどうか．（デフォルト：`true`） |
| `label?` | `string` | 相互参照で用いるラベル． |
| `style?` | `LstlistingStyle` | スタイルオプション． |

```tsx
<Lstlisting lang="ts" title="sample.ts" label="lst-1">
  {`const x: number = 42;
console.log(x);`}
</Lstlisting>
```

### `<LstInputlisting>`

ファイルを読み込んで行番号つきのコードブロックを生成する．
ファイルの読み込みは minitype の組版処理時に非同期で実行される（`BlockExtender` を返す）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | 読み込むファイルのパス． |
| `lang?` | `string` | シンタックスハイライトに使用する言語名． |
| `title?` | `string` | タイトルバーに表示するテキスト．省略時はタイトルバーを表示しない． |
| `firstLine?` | `number` | 表示を開始するソース上の行番号（1-based）． |
| `lastLine?` | `number` | 表示を終了するソース上の行番号（1-based，指定した行を含む）． |
| `firstDisplayNumber?` | `number` | 行番号として最初に表示される番号． |
| `showLineNumbers?` | `boolean` | 行番号を表示するかどうか．（デフォルト：`true`） |
| `label?` | `string` | 相互参照で用いるラベル． |
| `style?` | `LstlistingStyle` | スタイルオプション． |

```tsx
<LstInputlisting src="./src/main.ts" lang="ts" title="main.ts" firstLine={10} lastLine={30} />
```

## 説明リスト

### `<Description>`

HTML ライクな記法で説明リストを生成する．
子要素に `<Dt>`（見出し）と `<Dd>`（本文）を交互に並べる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `DescriptionChildren` | 子要素（`Dt` と `Dd` の交互列）． |
| `indent?` | `number \| Em` | インデント．（デフォルト：`em(4)`） |
| `space?` | `number \| Em` | 見出しと本文との間で最小限確保すべきスペース．（デフォルト：`em(1)`） |
| `termBreak?` | `boolean` | 見出しの直後に強制改行を挿入するかどうか．（デフォルト：`false`） |
| `gap?` | `number` | アイテム間の縦方向のスペース（mm）． |
| `style?` | `Partial<TextStyle>` | テキストスタイルの上書き． |

### `<Dt>`

`<Description>` の見出しを生成する．直後に `<Dd>` を配置する必要がある．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（インライン，見出し）． |

### `<Dd>`

`<Description>` の本文を生成する．直前に `<Dt>` が必要．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（インライン，本文）． |

```tsx
<Description indent={em(5)}>
  <Dt>用語1</Dt>
  <Dd>説明文1．</Dd>
  <Dt>用語2</Dt>
  <Dd>説明文2．</Dd>
</Description>
```

## テーブル

### `<Easytable>`

HTML ライクな記法でテーブルを作成する．
子要素に `<Tr>`（行）を並べ，その内側に `<Td>`（セル）を並べる．
`caption` を指定した場合，テーブルとキャプションを `Box` でラップして返す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `EasytableChildren` | 子要素（`Tr` の行）． |
| `caption?` | `string \| minitype.InlineOrExtender[]` | 表のキャプション．指定すると表とキャプションを Box でラップして返す． |
| `label?` | `string` | 表のラベル．相互参照で用いる文字列キー． |
| `style?` | `Partial<minitype.TableStyle>` | 表のスタイル． |

### `<Tr>`

`<Easytable>` の行を生成する．子要素として `<Td>` を並べる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `EasyRowChildren` | 子要素（`Td` の列）． |

### `<Td>`

`<Tr>` のセルを生成する．children はインライン要素として扱われる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（インライン）． |
| `colspan?` | `number` | 列の結合数． |

```tsx
<Easytable caption="表タイトル" label="table:sample">
  <Tr>
    <Td>ヘッダ1</Td>
    <Td>ヘッダ2</Td>
    <Td>ヘッダ3</Td>
  </Tr>
  <Tr>
    <Td colspan={2}>結合セル</Td>
    <Td>C</Td>
  </Tr>
  <Tr>
    <Td>A</Td>
    <Td><B>太字</B>普通</Td>
    <Td>C</Td>
  </Tr>
</Easytable>
```

## 目次

### `<Toc>`

目次を生成する．`TocOptions` を Props として受け取る．

**デフォルト表記（`TocOptionsDefault`）：**

| Prop | 型 | 説明 |
| --- | --- | --- |
| `filter?` | `(level, text) => boolean` | 見出しのフィルタ関数． |
| `levelSpaceBefore?` | `Partial<Record<HeadingLevel, number>>` | 見出しレベルごとのエントリ前スペース（mm）． |
| `showIndex?` | `boolean` | 見出し番号を目次に含めるかどうか（デフォルト：`false`）． |
| `indexFormat?` | `Partial<Record<HeadingLevel, (index) => string>>` | 見出し番号の整形関数． |
| `levelStyles?` | `Partial<Record<HeadingLevel, Partial<TextStyle>>>` | レベル別の段落スタイル． |
| `hboxWidth?` | `(level) => HboxWidth` | 見出し番号ボックスの幅． |
| `fill?` | `string \| false` | リーダ文字（デフォルト：`"…"`）． |

**カスタム表記（`TocOptionsCustom`）：**

| Prop | 型 | 説明 |
| --- | --- | --- |
| `filter?` | `(level, text) => boolean` | 見出しのフィルタ関数． |
| `levelSpaceBefore?` | `Partial<Record<HeadingLevel, number>>` | 見出しレベルごとのエントリ前スペース（mm）． |
| `entry` | `TocEntryMapper` | カスタムエントリのマッパ関数． |

```tsx
<Toc showIndex={true} fill="." />
```

## 図表一覧

### `<ListOf>`

図表一覧を生成する．`ListOfOptions` を Props として受け取る．

**デフォルト表記（`ListOfOptionsDefault`）：**

| Prop | 型 | 説明 |
| --- | --- | --- |
| `filter?` | `(label) => boolean` | 図表のフィルタ関数． |
| `spaceBefore?` | `number` | h1 見出しをまたいだときのエントリ前スペース（mm）． |
| `showIndex?` | `boolean` | 図表番号を含めるかどうか（デフォルト：`false`）． |
| `indexFormat?` | `Partial<Record<ListOfTarget, (index) => string>>` | 図表番号の整形関数． |
| `style?` | `Partial<TextStyle>` | エントリの段落スタイル． |
| `hboxWidth?` | `(type) => HboxWidth` | 図表番号ボックスの幅． |
| `fill?` | `string \| false` | リーダ文字（デフォルト：`"…"`）． |

**カスタム表記（`ListOfOptionsCustom`）：**

| Prop | 型 | 説明 |
| --- | --- | --- |
| `filter?` | `(label) => boolean` | 図表のフィルタ関数． |
| `spaceBefore?` | `number` | h1 見出しをまたいだときのエントリ前スペース（mm）． |
| `entry?` | `(label) => Block` | カスタムエントリのマッパ関数． |

### `<ListOfImages>`，`<ListOfTables>`，`<ListOfEquations>`，`<ListOfCodes>`

それぞれ図・表・数式・コードに絞った図表一覧を生成する．
`filter` を除く `ListOfOptions` のフィールドを Props として受け取る（`ListOfSpecificProps`）．

```tsx
<ListOfImages showIndex={true} />
<ListOfTables />
```

## 背景画像

### `<BackgroundImage>`

画像をページ全体（あるいは余白を差し引いたサイズ）で背面に配置する．
ページサイズは組版処理時に自動取得される（`BlockExtender` を返す）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | 画像ファイルのパス |
| `direction?` | `"width" \| "height" \| "both"` | サイズを適用する方向（デフォルト：`"width"`） |
| `margin?` | `number` | ページ端からの余白（mm，両側，デフォルト：`0`） |
| `page?` | `number \| ((pageIndex) => boolean)` | 表示対象ページ |
| `zIndex?` | `number` | 重ね順序（デフォルト：`-1`） |

```tsx
<BackgroundImage src="./bg.png" direction="both" zIndex={-1} />
```

## Markdown

### `<MdString>`

Markdown 文字列をブロック列に変換する．
`children` に Markdown テキストを渡す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（Markdown 文字列）． |
| `mapping?` | `MarkdownMapping` | ブロック，インラインのマッピング設定． |

`MarkdownMapping` では，`h1`〜`h4`，`paragraph`，`code`，`list`，`footnote`，`image`，`hr`，`table`，`containers`，`yaml`（ブロック）および `em`，`strong`，`codespan`，`link`（インライン）のマッパ関数を上書きできる．

```tsx
<MdString>
  {`## 見出し
  
  本文テキスト．**太字**や*斜体*も使える．`}
</MdString>
```

### `<MdFile>`

Markdown ファイルを読み込んでブロック列に変換する．
ファイルの読み込みは minitype の組版処理時に非同期で実行される（`BlockExtender` を返す）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | Markdown ファイルのパス． |
| `mapping?` | `MarkdownMapping` | ブロック，インラインのマッピング設定． |

```tsx
<MdFile src="./content.md" />
```

## 参考文献

### `<StaticBibliography>`

`ReferenceRecord` を静的な参考文献リストとして展開する．
文中の出現順ソートが不要な場合に使用する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `record` | `ReferenceRecord` | 参考文献レコード |

`ReferenceRecord` は `Record<string, Reference>` であり，`Reference` は `Article`，`InProceedings`，`Book`，`MasterThesis`，`PhdThesis`，`WebPage`，`Misc` のいずれか．

```tsx
const record: ReferenceRecord = {
  smith2020: { type: "article", title: "...", authors: ["Smith"], year: 2020, ... },
};

<StaticBibliography record={record} />
```

### `<StaticBibliographyFile>`

BibTeX ファイルを読み込んで静的な参考文献リストに変換する．
ファイルの読み込みは minitype の組版処理時に非同期で実行される（`BlockExtender` を返す）．
引用順ソートが必要な場合は，minitype の `createBibliography` を JSX 外で呼び出し，返された `cite()` をインライン，`bibliography()` をブロックとして使用する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | BibTeX ファイルのパス |

```tsx
<StaticBibliographyFile src="./references.bib" />
```
