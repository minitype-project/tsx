# コンポーネント一覧

## ドキュメント構造

### `<Document>`

ドキュメントのルート要素．`groups`（`Group[]`）と `style`（`Partial<DocumentStyle>`）を持つオブジェクトを返す．
返り値を `minitype()` に渡す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<DocumentStyle>` | ドキュメント全体のスタイル |
| `children?` | `GroupChildren` | `<Group>` 要素 |

```tsx
<Document
  style={{
    size: { width: 210, height: 297 },
    padding: { top: 20, bottom: 20, left: 25, right: 25 },
    writingMode: "horizontal-tb",
    block: {
      paragraph: { size: 10, lineHeight: 1.8 },
      h1: { size: 18 },
    },
  }}
>
  ...
</Document>
```

### `<Group>`

ページグループ要素．ページサイズやスタイルを切り替える単位．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<GroupStyle>` | グループ固有のスタイル（`DocumentStyle` から `size` を除いたもの） |
| `pageIndex?` | `number` | グループ開始ページ番号（省略時はドキュメントの通し番号） |
| `labelOptions?` | `GroupLabelOptions` | ラベル関連の設定 |
| `children?` | `BlockChildren` | ブロック要素 |

---

## ブロック

### テキスト

#### `<P>`

段落．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<TextStyle>` | テキストスタイル |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<H1>` `<H2>` `<H3>` `<H4>`

見出し（レベル 1〜4）．`<P>` の Props に加えて以下を持つ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `unnumbered?` | `boolean` | `true` を指定すると番号を付与しない |

#### `<Caption>`

キャプション．Props は `<P>` と同じ．

#### `<Code>`

コードブロック．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `lang?` | `string` | シンタックスハイライトの言語 |
| `style?` | `Partial<TextStyle & CodeStyle>` | テキストスタイル + コードスタイル |
| `children?` | `InlineChildren` | コードテキスト |

```tsx
<Code lang="ts">{`const x: number = 42;`}</Code>
```

#### `<Math>`

数式ブロック（LaTeX）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<MathStyle>` | 数式スタイル（`size`: フォントサイズ mm） |
| `children?` | `InlineChildren` | LaTeX 文字列 |

```tsx
<Math>{String.raw`\int_0^\infty e^{-x}\,dx = 1`}</Math>
```

#### `<Li1>` `<Li2>` `<Li3>`

順序なしリスト（レベル 1〜3）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<TextStyle & ListStyle>` | テキストスタイル + リストスタイル |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Ol1>` `<Ol2>` `<Ol3>`

順序付きリスト（レベル 1〜3）．Props は `<Li1>` と同じ．

#### `<Footnote>`

脚注本文．`<Fn>` で参照する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `label` | `string` | 脚注のラベル（`<Fn>` と対応させる） |
| `style?` | `Partial<TextStyle & FootnoteStyle>` | テキストスタイル + 脚注スタイル |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

```tsx
<P>本文テキスト<Fn label="note-1" />．</P>
<Footnote label="note-1">脚注の内容．</Footnote>
```

---

### テーブル

#### `<Table>`

テーブル．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<TableStyle>` | テーブルスタイル |
| `children?` | `TableChildren` | `<Row>` 要素 |

#### `<Row>`

テーブルの行．`<Cell>` 要素の配列を返す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `RowChildren` | `<Cell>` 要素 |

#### `<Cell>`

テーブルのセル．子要素はブロック要素 1 つのみ受け付ける．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `colspan?` | `number` | 列の結合数 |
| `children?` | `BlockChildren` | ブロック要素（1 つのみ） |

```tsx
<Table style={{ columnWidths: [40, 120] }}>
  <Row>
    <Cell><P>名前</P></Cell>
    <Cell><P>説明</P></Cell>
  </Row>
</Table>
```

---

### 図・図形

#### `<Image>`

画像（PNG，JPEG，PDF 等）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | 画像ファイルのパス |
| `style?` | `Partial<ImageStyle>` | 画像スタイル |

#### `<Rect>`

矩形．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `width` | `number` | 幅（mm） |
| `height` | `number` | 高さ（mm） |
| `style?` | `Partial<ShapeStyle>` | 図形スタイル（`align`，`background`，`border` 等） |

#### `<Ellipse>`

楕円．Props は `<Rect>` と同じ．

---

### ボックス・セクション

#### `<Box>`

ブロック要素をまとめるコンテナ．背景・枠線・段組・テキスト回り込みなどを設定できる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<BoxStyle>` | ボックススタイル |
| `semanticType?` | `"image" \| "table" \| "math" \| "code"` | 意味上のブロック種別（ギャップ計算に影響） |
| `children?` | `BlockChildren` | ブロック要素 |

```tsx
<Box style={{ padding: { top: 5, bottom: 5, left: 10, right: 10 }, background: [{ type: "fill", color: "#f5f5f5" }] }}>
  <P>囲みテキスト</P>
</Box>
```

#### `<Flexbox>`

子 `<Box>` をインライン方向に並べるコンテナ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<FlexboxStyle>` | フレックスボックス��タイル |
| `children?` | `BlockChildren` | `<Box>` 要素 |

```tsx
<Flexbox style={{ gap: 5 }}>
  <Box style={{ inlineSize: { ratio: 0.5 } }}><P>左カラム</P></Box>
  <Box style={{ inlineSize: { ratio: 0.5 } }}><P>右カラム</P></Box>
</Flexbox>
```

#### `<Float>`

フロート配置コンテナ．ページ上端または下端に固定して配置する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `position` | `"top" \| "bottom"` | 配置位置 |
| `children?` | `BlockChildren` | ブロック要素 |

#### `<Move>`

ブロック要素をオフセット移動するコンテナ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `inlineOffset?` | `number` | インライン方向のオフセット（mm） |
| `blockOffset?` | `number` | ブロック方向のオフセット（mm） |
| `children?` | `BlockChildren` | ブロック要素 |

#### `<Section>`

スタイルを子ブロックに継承する透過的なコンテナ．レイアウトには影響しない．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `block?` | `Partial<BlockStyleRecord>` | 子ブロックへ上書きする `BlockStyleRecord` |
| `children?` | `BlockChildren` | ブロック要素 |

---

### ページ制御

#### `<NewPage>`

改ページ．Props なし．

#### `<ClearPage>`

フロートを出力してから改ページ．Props なし．

#### `<NewColumn>`

改段．Props なし．

#### `<Vspace>`

垂直スペース（絶対値）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `space` | `number` | スペースの大きさ（mm） |

#### `<Addvspace>`

垂直スペース（加算）．既存のブロック間 gap に加算する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `space` | `number` | 加算するスペースの大きさ（mm） |

#### `<ResetLabel>`

カウンタリセット．見出し番号・図番号などをリセットする．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `types?` | `ResetLabelType[]` | リセット対象の種別（省略時は全てリセット） |

`ResetLabelType` の値：`"h1"` `"h2"` `"h3"` `"h4"` `"image"` `"table"` `"math"` `"caption"` `"footnote"`

---

## インライン要素

#### `<B>`

太字．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<U>`

下線．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Del>`

取り消し線．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Sup>`

上付き文字．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Sub>`

下付き文字．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Color>`

文字色．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `value` | `Color` | 文字色（CSS カラー文字列または `[r, g, b]`） |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<FontSize>`

文字サイズ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `size` | `number` | フォントサイズ（mm） |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Scale>`

文字スケール．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `factor` | `Em` | スケール（em 単位） |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Overline>`

上線．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `line` | `Line` | 上線のスタイル |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Ruby>`

ルビ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `ruby` | `string` | ルビ文字 |
| `children` | `string` | 親文字 |

```tsx
<Ruby ruby="くみはん">組版</Ruby>
```

#### `<Url>`

ハイパーリンク．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `href` | `string` | リンク先 URL |
| `children?` | `InlineChildren` | リンクテキスト（省略時は URL を表示） |

#### `<Command>`

汎用インライン装飾．`DocumentStyle.command` に定義したスタイルを名前で適用する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `name?` | `string` | コマンド名（`command` スタイルと対応させる） |
| `style?` | `CommandStyle` | インラインスタイルを直接指定 |
| `label?` | `string` | ラベル |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<Hbox>`

水平ボックス（固定幅のインラインコンテナ）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `width` | `HboxWidth` | 幅 |
| `fill?` | `string` | 指定した文字列で幅を埋める |
| `align?` | `"left" \| "center" \| "right" \| "justify"` | 文字揃え |
| `children?` | `InlineChildren` | インライン要素またはテキスト（`fill` 未指定時） |

#### `<InlineGraphic>`

インライングラフィック．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | 画像ファイルのパス |
| `size?` | `number \| Em` | サイズ |
| `blockOffset?` | `number \| Em` | ブロック方向のオフセット |
| `page?` | `number` | PDF 埋め込み時のページ番号（1-based） |

#### `<InlineMath>`

インライン数式（LaTeX）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `latex` | `string` | LaTeX 文字列 |
| `size?` | `number \| Em` | フォントサイズ |

---

## インライン制御

#### `<Br>`

行区切り．minitype の `InlineOrExtender[][]`（行の配列）における行の境界を作る．
テキストブロック（`<P>` など）内で複数行を明示的に指定したい場合に使用する．

Props なし．

```tsx
<P>
  1行目
  <Br />
  2行目
</P>
```

インライン装飾要素（`<B>`，`<Color>` など）の内側でも使用できる．
その場合，`<Br />` を境界として装飾を各行に個別に適用した結果を返す．

```tsx
{/* <B>1行目</B><Br/><B>2行目</B> と等価 */}
<B>
  1行目
  <Br />
  2行目
</B>
```

#### `<Fbr>`

強制改行（minitype の `fbr`）．行を途中で折り返す．`<Br />` とは異なり，`InlineOrExtender[][]` の行境界ではなく，行中での改行を表す．

Props なし．

#### `<Kern>`

カーニング（文字間隔の調整）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `em` | `number` | カーニング量（em 単位） |

#### `<NoBreak>`

行分割禁止．Props なし．

#### `<NoSplit>`

行分割・トラッキング挿入禁止．Props なし．

#### `<Cid>`

CID 直接指定．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `id` | `number` | CID 値 |

#### `<Fn>`

脚注参照マーカ．`<Footnote>` と `label` を対応させる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `label` | `string` | 参照する脚注のラベル |
