# Changelog

本プロジェクトの主な変更点を記録する．

書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に，バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/spec/v2.0.0.html) に従う．

## [0.2.2] - 2026-11-23

### Added

- コンポーネント
  - 縦中横を行う `<Tcy>` を追加．
  - 行分割位置を指定する `<Wbr>` を追加．
  - カーニングを加算して指定する `<Addkern>` を追加．
  - ノーブレークスペースを挿入する `<NoBreakSpace>` を追加．
  - ここまでインデントを行う `<IndentHere>` を追加．
  - リスト要素に `start`，`resume` 属性を追加．
- MDX
  - `baseUrl` の指定時に，`img`，`Image`，`Figure` 等の `src` の相対パス，およびパッケージの import を記事の位置から解決するように変更．
  - 相対パスの解決方法を指定する `resolveAsset` オプションを追加．
- その他
  - `filterWhitespace`，`isMdxCode`，`MdxCodeWrapper`，`CJK_OR_FULLWIDTH` をエクスポート．

### Changed

- `@minitype/minitype` 0.2.0 に対応．
- MDX において，コードフェンスの meta を `data-meta` 属性として保持し，`lang:caption` 形式の info string に対応．
- ソースコードを `jsx`，`mdx` ディレクトリに再編．

### Fixed

- MDX
  - 自動リンクの URL を和文文字の手前で終端するように修正．
  - 脚注等のブロック要素内の強制改行を保持するように修正．
  - 1 以外から始まる番号付きリスト，および分割したルーズリストの番号を保持するように修正．
  - 言語指定のないコードブロックがインラインコードとして扱われる問題を修正．
- 和文文字の判定において，CJK 統合漢字拡張 B 以降（例：「𠮟」）の文字に対応．

## [0.2.1] - 2026-09-28

### Fixed

- MDX において，入れ子のリストに対応し，ルーズリストを分割するように修正．
- MDX の段落において，ソフト改行を前後の文字種に基づいて正規化．

## [0.2.0] - 2026-09-26

### Added

- フロントマターおよび remark プラグインによる MDX のサポートを追加．

## [0.1.2] - 2026-09-12

### Fixed

- `Fragment` において，配列のネストおよび関数の子要素の平坦化に対応．
- 隣接するテキストノードの境界における和文間の空白を除去．
- `Td` において，複数行の子要素に対応．

## [0.1.1] - 2026-09-07

### Added

- `PluginBlock`，`PluginInline` コンポーネントおよびドキュメントを追加．

## [0.1.0] - 2026-09-05

### Added

- 初回リリース．
