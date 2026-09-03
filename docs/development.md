# 開発ガイド

```bash
# 依存関係のインストール
yarn

# 配布用バンドルをビルド
yarn build
# フォーマット（biome）
yarn check

# サンプル PDF を生成（sample/output.pdf に出力）
yarn sample

# ライセンスヘッダの付与・検証（addlicense）
yarn license        # ライセンスヘッダを付与
yarn license:check  # ライセンスヘッダの付与状況を確認

# CHANGELOG の更新
yarn changelog

# GitHub Actions ワークフローの検証（actionlint）
actionlint .github/workflows/<file>.yml
```

## 開発・リリース手順

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従ってコミットメッセージを記述する．
husky によって `git commit` 時に commitlint が実行される．
フォーマットが違反している場合はコミットが拒否される．

```
<type>: <description>
```

主な type：

| type | 用途 |
| --- | --- |
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `chore` | ビルド・設定・依存関係 |
| `refactor` | リファクタリング |
| `test` | テスト |

### リリースフロー

バージョンの更新，CHANGELOG 更新，GitHub Release 作成，npm publish は CI を通じて行う．

1. 変更を `main` にマージ
2. GitHub Actions の `Release Please` ワークフローを手動実行
3. 自動作成された Release PR をレビューおよびマージ
4. Release PR のマージを検知して `Release Please` が再度実行され，GitHub Release が作成される
5. GitHub Release の作成を検知して npm publish が自動実行される

## コーディングスタイル

### 関数定義

可能な限り `function` 宣言を使用せず，アロー関数として記述する．
トップレベルの関数は `return` 文を使った複数行形式で記述する．

```ts
// OK
const greet = (name: string) => {
  return `Hello, ${name}`;
};

// NG
function greet(name: string) {
  return `Hello, ${name}`;
}

// NG
const greet = (name: string) => `Hello, ${name}`;
```

### 制御構文

`if`・`for` の本体が 1 行でも中括弧を省略しない．

```ts
// OK
if (condition) {
  doSomething();
}

// NG
if (condition) doSomething();
```

### 変数名

慣習的なもの（`i`，`j`，`k` 等）を除き，1 文字の変数名を使用しない．

### コメント

ソースコード中のコメントおよびドキュメントの句読点はカンマ（，），ピリオド（．）を使用する．

見出しは以下の形式で記述する．

```ts
// ------
// 見出し
// ------
```

TSDoc に関しては，フィールドを除いて複数行で記述する．

```ts
/**
 * ファイルを読み込む．（動詞止め）
 * @param path ファイルパス．（体言止め）
 * @returns ファイルの内容．（体言止め）
 */
```

### エラー・ログメッセージ

`console.error`，`new Error()` 等のユーザ向けメッセージは英語で記述する．
