# コンポーネント一覧（インライン）

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
テキストブロック（`<P>` 等）内で複数行を明示的に指定したい場合に使用する．

Props なし．

```tsx
<P>
  1行目
  <Br />
  2行目
</P>
```

インライン装飾要素（`<B>`，`<Color>` 等）の内側でも使用できる．
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
