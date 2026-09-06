# コンポーネント一覧（プラグイン／インライン）

## 相互参照

### `<Ref>`

参照先の番号に変換するインラインエクステンダ．リンク付き．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `label` | `string` | 参照先のラベルまたは ID． |

### `<Pageref>`

参照先のページ番号に変換するインラインエクステンダ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `label` | `string` | 参照先のラベルまたは ID． |

### `<Autoref>`

参照先の種類と番号（例：図 1）に変換するインラインエクステンダ．リンク付き．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `label` | `string` | 参照先のラベルまたは ID． |

```tsx
<P><Autoref label="fig-1" /> を参照．</P>
```

## ページ情報

### `<Page>`

現在のページ番号に変換するインラインエクステンダ．Props なし．

### `<TotalPages>`

総ページ数に変換するインラインエクステンダ．Props なし．

```tsx
<P><Page /> / <TotalPages /></P>
```

## リスト

### `<Marker>`

リストのマーカに変換するインラインエクステンダ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `before` | `string` | マーカの前に挿入する文字列． |
| `after` | `string` | マーカの後に挿入する文字列． |

## 柱

### `<HeadingInPage>`

現在のページに出現した見出しテキストに変換するインラインエクステンダ．
柱（ランニングヘッダー）として使用することを想定する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `level?` | `HeadingLevel` | 取得する見出しのレベル．（デフォルト：`1`） |
| `select?` | `"first" \| "last"` | `first`: ページ内の最初，`last`: ページ内の最後．（デフォルト：`"last```） |
| `fallback?` | `boolean` | ページ内に対象の見出しがない場合，直前ページの見出しにフォールバックするかどうか．true の場合フォールバックする．false の場合は空となる．（デフォルト：`true`） |

```tsx
// <Flow> 内での使用例
<Flow position="pillar">
  <P><HeadingInPage level={1} select="last" /></P>
</Flow>
```

## 目次・図表一覧

### `<TocIndex>`

目次エントリの見出し番号に変換するインラインエクステンダ．
`<Toc>` の `entry` カスタムマッパ内で使用することを想定する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `id` | `string` | 見出しのブロック ID． |
| `level` | `HeadingLevel` | 見出しのレベル． |
| `format?` | `(index: HeadingIndex) => string` | 見出し番号の整形関数． |

### `<ListOfIndex>`

図表一覧エントリの番号に変換するインラインエクステンダ．
`<ListOf>` の `entry` カスタムマッパ内で使用することを想定する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `id` | `string` | 図表のブロック ID． |
| `format?` | `(index: string) => string` | 図表番号の整形関数． |

## 圏点

### `<Kenten>`

`children` に圏点を付与するインラインエクステンダ．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（圏点を付与するインライン）． |
| `mark?` | `KentenMark` | 圏点の記号．プリセット名または任意の 1 文字を指定する．（デフォルト：`"bullet"`） |

`KentenMark` の値：`"bullet"`，`"white-bullet"`，`"sesame"`，`"white-sesame"`，`"triangle"`，`"white-triangle"`，`"double-circle"`，またはマーク文字として使用する任意の 1 文字．

```tsx
<P><Kenten mark="sesame">重要な語句</Kenten></P>
```

## SI 単位・数値

### `<Num>`

数値を適切にフォーマットするインライン要素の配列を返す．
科学的記数法の文字列（例：`"3.0e8"`）は指数部を上付き文字で表示する．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `value` | `string \| number` | 数値または科学的記数法の文字列（例：`"3.0e8"`）． |

### `<Si>`

SI 単位系の数値と単位を適切にフォーマットするインライン要素の配列を返す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `value` | `string \| number` | 数値または科学的記数法の文字列（例：`"3.0e8"`）． |
| `unit` | `string` | 単位文字列（例：`"kg.m/s^2"`）．`.` で因子を連結，`/` で分母を指定，`^n` で指数を指定する． |

単位文字列の記法：`.` で因子を連結，`/` で分母を指定，`^n` で指数を指定する．

```tsx
<P>光速は <Si value="3.0e8" unit="m/s" /> である．</P>
<P>力の単位は <Si value={1} unit="kg.m/s^2" /> である．</P>
```

## Markdown インライン

### `<MdInline>`

Markdown のインライン記法を含む文字列をインライン要素の配列に変換する．
`children` に Markdown テキストを渡す．

| Prop | 型 | 説明 |
| --- | --- | --- |
| `children?` | `InlineChildren` | 子要素（Markdown インライン記法を含む文字列）． |
| `mapping?` | `MarkdownMapping` | ブロック，インラインのマッピング設定． |

```tsx
<P><MdInline>{`**太字**や*斜体*を含むテキスト`}</MdInline></P>
```
