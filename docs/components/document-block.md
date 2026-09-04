# コンポーネント一覧（ドキュメント，ブロック）

## ドキュメント構造

### `<Document>`

ドキュメントのルート要素．
`groups`（`Group[]`）と `style`（`Partial<DocumentStyle>`）を持つオブジェクトを返す．
返り値を `minitype()` に渡す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `GroupChildren` | 子要素（グループ）． |
| `style?` | `DocumentResult["style"]` | ドキュメントスタイル． |

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

ページグループ要素．
ページサイズやスタイルを切り替える単位．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BodyChildren` | 子要素（ブロックまたはフロー）． |
| `style?` | `GroupStyle` | グループスタイル． |
| `pageIndex?` | `number` | 開始ページ番号． |
| `labelOptions?` | `GroupLabelOptions` | ラベルオプション． |

### `<Flow>`

版面上端，下端，ページ左上を基準に要素を絶対配置する．
柱やノンブルの配置に使用する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ブロック）． |
| `position` | `minitype.Flow["position"]` | フローの基準位置．<br>- `"pillar"`：版面上端（縦組の場合は右端）<br>- `"nombre"`：版面下端（縦組の場合は左端）<br>- `"page"`：ページ左上 |
| `inlineOffset?` | `number` | インライン方向のオフセット（mm）． |
| `blockOffset?` | `number` | ブロック方向のオフセット（mm）． |
| `inlineSize?` | `number` | インライン方向のサイズ（mm）． |
| `page?` | `number \| PageFilter` | 表示するページ（ページ番号またはフィルタ関数）． |
| `writingMode?` | `WritingMode` | 書字方向． |
| `zIndex?` | `number` | 重ね順序． |

## ブロック

### ブロックの共通 Props

`<Flow>`，`<Row>`，`<Cell>` を除くすべてのブロックコンポーネントは，以下の共通する Props を持つ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `label?` | `string` | 相互参照で用いるラベル |
| `id?` | `string` | ブロックの ID |

### テキスト

#### `<P>`

段落．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<TextStyle>` | テキストスタイル |
| `children?` | `InlineChildren` | インライン要素またはテキスト |

#### `<H1>`，`<H2>`，`<H3>`，`<H4>`

<!-- Props: HeadingProps -->

見出し（レベル 1〜4）．
`<P>` の Props に加えて以下を持つ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `unnumbered?` | `boolean` | 番号を付与しないかどうか．`true` の場合，番号を付与しない．（デフォルト：`false`） |

#### `<Caption>`

キャプション．
Props は `<P>` と同じ．

#### `<Code>`

コードブロック．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（インライン，コード文字列）． |
| `lang?` | `string` | シンタックスハイライトに用いる言語名． |
| `style?` | `Partial<TextStyle & CodeStyle>` | テキストスタイル + コードブロックスタイル． |

```tsx
<Code lang="ts">{`const x: number = 42;`}</Code>
```

#### `<MathBlock>`

数式ブロック（LaTeX）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `style?` | `Partial<MathStyle>` | 数式スタイル（`size`: フォントサイズ mm） |
| `children?` | `InlineChildren` | LaTeX 文字列 |

```tsx
<MathBlock>{String.raw`\int_0^\infty e^{-x}\,dx = 1`}</MathBlock>
```

#### `<Li1>`，`<Li2>`，`<Li3>`

<!-- Props: ListProps -->

順序なしリスト（レベル 1〜3）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（インライン）． |
| `style?` | `Partial<TextStyle & ListStyle>` | リストスタイル． |

#### `<Ol1>`，`<Ol2>`，`<Ol3>`

順序付きリスト（レベル 1〜3）．
Props は `<Li1>` と同じ．

#### `<Footnote>`

脚注本文．`<Fn>` で参照する．
`<Footnote>` の `label` は相互参照ラベルではなく `<Fn>` との対応付けに使用するキーであるため，必須かつ意味が異なる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（インライン）． |
| `label` | `string` | 脚注のラベル（`Fn` と対応させる）． |
| `style?` | `Partial<TextStyle & FootnoteStyle>` | テキストスタイル + 脚注スタイル． |
| `id?` | `string` | ブロックの ID． |

```tsx
<P>本文テキスト<Fn label="note-1" />．</P>
<Footnote label="note-1">脚注の内容．</Footnote>
```

### テーブル

#### `<Table>`

テーブル．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `TableChildren` | 子要素（行）． |
| `style?` | `Partial<TableStyle>` | テーブルスタイル． |

#### `<Row>`

テーブルの行．
`<Cell>` 要素の配列を返す．
Props なし（`label`，`id` も持たない）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `RowChildren` | 子要素（セル）． |

#### `<Cell>`

テーブルのセル．
子要素はブロック要素 1 つのみ受け付ける．
Props なし（`label`，`id` も持たない）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ブロック，1 つのみ）． |
| `colspan?` | `number` | 列の結合数． |

```tsx
<Table style={{ columnWidths: [40, 120] }}>
  <Row>
    <Cell><P>名前</P></Cell>
    <Cell><P>説明</P></Cell>
  </Row>
</Table>
```

### 図，図形

#### `<Image>`

画像（PNG，JPEG，PDF 等）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `src` | `string` | 画像ファイルのパス． |
| `style?` | `Partial<ImageStyle>` | 画像スタイル． |

#### `<Rect>`

矩形．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `width` | `number` | 幅（mm）． |
| `height` | `number` | 高さ（mm）． |
| `style?` | `Partial<ShapeStyle>` | 図形スタイル． |

#### `<Ellipse>`

楕円．Props は `<Rect>` と同じ．

### ボックス，セクション

#### `<Box>`

ブロック要素をまとめるコンテナ．
背景，枠線，段組，テキストの回り込み等を設定できる．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ブロック）． |
| `style?` | `Partial<BoxStyle>` | ボックススタイル． |
| `semanticType?` | `minitype.Box["semanticType"]` | 意味上のブロック種別．gap の計算に使用される． |

```tsx
<Box style={{ padding: { top: 5, bottom: 5, left: 10, right: 10 }, background: [{ type: "fill", color: "#f5f5f5" }] }}>
  <P>囲みテキスト</P>
</Box>
```

#### `<Flexbox>`

子 `<Box>` をインライン方向に並べるコンテナ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ボックス）． |
| `style?` | `Partial<FlexboxStyle>` | フレックスボックススタイル． |

```tsx
<Flexbox style={{ gap: 5 }}>
  <Box style={{ inlineSize: { ratio: 0.5 } }}><P>左カラム</P></Box>
  <Box style={{ inlineSize: { ratio: 0.5 } }}><P>右カラム</P></Box>
</Flexbox>
```

#### `<Float>`

フロート配置コンテナ．
ページ上端または下端に固定して配置する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ブロック）． |
| `position` | `"top" \| "bottom"` | 配置位置． |

#### `<Move>`

ブロック要素をオフセット移動するコンテナ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ブロック）． |
| `inlineOffset?` | `number` | インライン方向のオフセット（mm）． |
| `blockOffset?` | `number` | ブロック方向のオフセット（mm）． |

#### `<Section>`

スタイルを子ブロックに継承する透過的なコンテナ．
レイアウトには影響しない．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `BlockChildren` | 子要素（ブロック）． |
| `block?` | `Partial<BlockStyleRecord>` | 子ブロックへ上書きするスタイル． |

### ページ制御

#### `<NewPage>`

改ページ．

#### `<ClearPage>`

フロートを出力してから改ページ．

#### `<NewColumn>`

改段．

#### `<Vspace>`

垂直スペース（絶対値）．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `space` | `number` | スペース量（mm）． |

#### `<Addvspace>`

垂直スペース（加算）．
既存のブロック間 gap に加算する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `space` | `number` | 加算するスペースの大きさ（mm）． |

#### `<ResetLabel>`

カウンタリセット．
見出し番号，図番号等をリセットする．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `types?` | `ResetLabelType[]` | リセットするカウンタの種類．省略時はすべてリセットする． |

`ResetLabelType` の値：`"h1"`，`"h2"`，`"h3"`，`"h4"`，`"image"`，`"table"`，`"math"`，`"caption"`，`"footnote"`

---
