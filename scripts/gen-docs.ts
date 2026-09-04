/**
 * TSDoc から markdown の Props テーブルを自動生成するスクリプト．
 * `src/components/` 内の `*Props` インターフェースを正本として，
 * `docs/components/*.md` の対応するテーブルを上書きする．
 *
 * 使用方法：yarn docs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

/**
 * インターフェースの 1 プロパティの情報．
 */
interface PropInfo {
  /** プロパティ名． */
  name: string;
  /** `?` が付いているかどうか． */
  optional: boolean;
  /** ソースに記述された型テキスト（型解決なし）． */
  typeText: string;
  /** JSDoc の説明文． */
  description: string;
  /** `@default` タグの値．存在しない場合は `undefined`． */
  defaultValue?: string;
}

/**
 * `*Props` インターフェースの解析結果．
 */
interface InterfaceInfo {
  /** 直接宣言されたプロパティの一覧（継承元は含まない）． */
  props: PropInfo[];
  /** `extends` 句に含まれる親インターフェース名の一覧． */
  extendsNames: string[];
  /**
   * `export type XProps = Y` 形式のエイリアスの場合，エイリアス先の型名．
   * エイリアスでない場合は `undefined`．
   */
  aliasTarget?: string;
}

/**
 * 型名をキー，プロパティ一覧を値とするレジストリ．
 * エイリアス解決のために `src/components/` 外のソースも含む．
 */
type TypeRegistry = Map<string, PropInfo[]>;

// ------
// JSDoc パース
// ------

/**
 * JSDoc コメント文字列を説明文と `@default` 値に分解する．
 * 複数行の説明は結合して返す．`@default` 以外のタグは無視する．
 * @param text `/** ... *\/` 形式の JSDoc 文字列．
 */
const parseJSDoc = (
  text: string,
): { description: string; defaultValue?: string } => {
  // `/**` と `*/` を除去して各行を正規化
  const inner = text.replace(/^\/\*\*/, "").replace(/\*\/$/, "");
  const lines = inner
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => line !== "");

  const descLines: string[] = [];
  let defaultValue: string | undefined;

  for (const line of lines) {
    if (line.startsWith("@default ")) {
      defaultValue = line.slice("@default ".length).trim();
    } else if (!line.startsWith("@")) {
      descLines.push(line);
    }
  }

  const description = descLines
    .reduce((acc, line) => {
      return line.startsWith("- ") ? `${acc}<br>${line}` : acc + line;
    }, "")
    .replace(/\{@link\s+([^}]+)\}/g, (_, name: string) => `\`${name.trim()}\``);
  return { description, defaultValue };
};

// ------
// TypeScript ソースパース（テキストベース）
// ------

/**
 * プロパティブロック（`{` の直後から `}` の直前まで）を解析する．
 * `parseSourceFile` と `buildTypeRegistry` で共通利用する．
 * @param lines ソース行の配列．
 * @param startIndex 開始行インデックス（`{` の次の行）．
 * @returns `{ props, endIndex }` — `endIndex` は閉じ括弧 `}` または `};` の行インデックス．
 */
const parsePropBlock = (
  lines: string[],
  startIndex: number,
): { props: PropInfo[]; endIndex: number } => {
  const props: PropInfo[] = [];
  let pendingJSDoc: string | null = null;
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === "}" || trimmed === "};") {
      break;
    }

    // JSDoc の収集：単行（`/** ... */`）と複数行の両方に対応
    if (trimmed.startsWith("/**")) {
      if (trimmed.endsWith("*/")) {
        pendingJSDoc = trimmed;
        i++;
      } else {
        const jsDocLines = [trimmed];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith("*/")) {
          jsDocLines.push(lines[i].trim());
          i++;
        }
        jsDocLines.push(lines[i].trim());
        pendingJSDoc = jsDocLines.join("\n");
        i++;
      }
      continue;
    }

    // プロパティ宣言のパース．
    // `name?: Type;` 形式にマッチする．
    // メソッドシグネチャ（`name(args): Type`）やインデックスシグネチャ（`[key: string]: Type`）はマッチしないため自動的に除外される．
    const propMatch = trimmed.match(/^(\w+)(\?)?\s*:\s*(.+)$/);
    if (propMatch) {
      const name = propMatch[1];
      const optional = propMatch[2] === "?";
      // 末尾のセミコロンを除去
      const typeText = propMatch[3].trim().replace(/;$/, "").trim();
      const { description, defaultValue } = pendingJSDoc
        ? parseJSDoc(pendingJSDoc)
        : { description: "", defaultValue: undefined };
      props.push({ name, optional, typeText, description, defaultValue });
      pendingJSDoc = null;
    } else if (trimmed !== "" && !trimmed.startsWith("//")) {
      // パース対象外の行（`readonly` 修飾子など）が来たら JSDoc をリセット
      pendingJSDoc = null;
    }

    i++;
  }

  return { props, endIndex: i };
};

/**
 * TypeScript ソースファイルから `*Props` インターフェースを解析する．
 * 継承元のフィールドは含めず，当該インターフェースで直接宣言されたフィールドのみを返す．
 * `export type XProps = Y;` 形式のエイリアスも検出し，`aliasTarget` として記録する．
 * @param source ソースファイルのテキスト．
 * @returns コンポーネント名（`Props` を除いた名前）をキーとする `InterfaceInfo` のマップ．
 */
const parseSourceFile = (source: string): Map<string, InterfaceInfo> => {
  const result = new Map<string, InterfaceInfo>();
  const lines = source.split("\n");
  let i = 0;

  while (i < lines.length) {
    // `export interface *Props` 行を検索
    const ifaceMatch = lines[i].match(
      /^export\s+interface\s+(\w+Props)\b(.*)\{/,
    );
    if (ifaceMatch) {
      // `FigureProps` → `Figure` のようにコンポーネント名を取り出す
      const componentName = ifaceMatch[1].slice(0, -"Props".length);

      // `extends Foo, Bar<Baz>` のような extends 句から親名を抽出する．
      // ジェネリクス（`<...>`）は除去して名前だけ残す．
      const extendsMatch = ifaceMatch[2].match(/extends\s+([\w,\s<>]+)/);
      const extendsNames = extendsMatch
        ? extendsMatch[1].split(",").map((s) => s.trim().replace(/<.*$/, ""))
        : [];

      i++;
      const { props, endIndex } = parsePropBlock(lines, i);
      result.set(componentName, { props, extendsNames });
      i = endIndex + 1;
      continue;
    }

    // `export type XProps = Y;` 形式のエイリアスを検索
    const typeAliasMatch = lines[i].match(
      /^export\s+type\s+(\w+Props)\s*=\s*(\w+)\s*;/,
    );
    if (typeAliasMatch) {
      const componentName = typeAliasMatch[1].slice(0, -"Props".length);
      const aliasTarget = typeAliasMatch[2];
      result.set(componentName, { props: [], extendsNames: [], aliasTarget });
      i++;
      continue;
    }

    i++;
  }

  return result;
};

/**
 * ディレクトリ内の TypeScript ソースファイルを再帰的に列挙する．
 * テストファイル（`.test.ts`）と型定義ファイル（`.d.ts`）は除外する．
 * @param dir 検索対象のディレクトリパス．
 */
const listTsFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listTsFiles(fullPath);
    }
    if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".d.ts")
    ) {
      return [fullPath];
    }
    return [];
  });
};

/**
 * 複数のディレクトリから TypeScript ソースを読み込み，型レジストリを構築する．
 * `export interface X { ... }` と `export type X = { ... }` の両形式に対応する．
 * エイリアス先の解決など，内部参照用に使用する．
 * @param srcDirs 検索対象のディレクトリパスの一覧．
 */
const buildTypeRegistry = (srcDirs: string[]): TypeRegistry => {
  const registry: TypeRegistry = new Map();

  for (const dir of srcDirs) {
    for (const filePath of listTsFiles(dir)) {
      const source = fs.readFileSync(filePath, "utf-8");
      const lines = source.split("\n");
      let i = 0;

      while (i < lines.length) {
        // `export interface TypeName {` または `export type TypeName = {`
        const ifaceMatch = lines[i].match(/^export\s+interface\s+(\w+)\b.*\{/);
        const typeObjMatch = lines[i].match(/^export\s+type\s+(\w+)\s*=\s*\{/);
        const match = ifaceMatch ?? typeObjMatch;

        if (match) {
          const typeName = match[1];
          i++;
          const { props, endIndex } = parsePropBlock(lines, i);
          registry.set(typeName, props);
          i = endIndex + 1;
          continue;
        }

        i++;
      }
    }
  }

  return registry;
};

/**
 * `src/components/` 配下のすべての `.ts` ファイルから `*Props` インターフェースを収集する．
 * 追加のディレクトリからも型レジストリを構築し，エイリアスを解決する．
 * @param srcDir コンポーネントソースのディレクトリパス．
 * @param extraTypeDirs エイリアス解決のために参照する追加ディレクトリ（例：`../minitype/src`）．
 */
const parseInterfaces = (
  srcDir: string,
  extraTypeDirs: string[],
): { interfaces: Map<string, InterfaceInfo>; typeRegistry: TypeRegistry } => {
  const interfaces = new Map<string, InterfaceInfo>();

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join(srcDir, f));

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf-8");
    for (const [name, info] of parseSourceFile(source)) {
      interfaces.set(name, info);
    }
  }

  // コンポーネントソース + 追加ディレクトリからレジストリを構築
  const typeRegistry = buildTypeRegistry([srcDir, ...extraTypeDirs]);

  // `export type XProps = Y` 形式のエイリアスを解決する
  for (const [, info] of interfaces) {
    if (info.aliasTarget !== undefined) {
      const targetProps = typeRegistry.get(info.aliasTarget);
      if (targetProps !== undefined) {
        info.props = targetProps;
      }
    }
  }

  return { interfaces, typeRegistry };
};

/**
 * `extends` 句にプロジェクト外の型が含まれているかを判定する．
 * 外部型を継承している場合，継承フィールドをスクリプトで把握できないためテーブル自動生成をスキップする．
 * エイリアス（`aliasTarget`）の場合は型レジストリで解決可能かどうかで判定する．
 * @param info 判定対象のインターフェース情報．
 * @param allInterfaces 全インターフェースのマップ（親の存在確認に使用）．
 * @param typeRegistry 型レジストリ（エイリアス解決の確認に使用）．
 */
const hasExternalExtends = (
  info: InterfaceInfo,
  allInterfaces: Map<string, InterfaceInfo>,
  typeRegistry: TypeRegistry,
): boolean => {
  // エイリアスの場合：レジストリに存在しなければ外部型とみなす
  if (info.aliasTarget !== undefined) {
    return !typeRegistry.has(info.aliasTarget);
  }
  // 通常の extends の場合：`*Props` 以外または未知の型は外部型とみなす
  return info.extendsNames.some((parent) => {
    if (!parent.endsWith("Props")) {
      return true;
    }
    const parentComponent = parent.slice(0, -"Props".length);
    return !allInterfaces.has(parentComponent);
  });
};

// ------
// markdown テーブル生成
// ------

/**
 * `PropInfo` の配列から GFM 形式の Props テーブル文字列を生成する．
 * @param props テーブルに並べるプロパティ情報．
 */
const generateTable = (props: PropInfo[]): string => {
  const rows = props.map((prop) => {
    const nameCell = `\`${prop.name}${prop.optional ? "?" : ""}\``;
    // union 型の `|` は GFM テーブル内でセル区切りと衝突するためエスケープ
    const typeCell = `\`${prop.typeText.replace(/\|/g, "\\|")}\``;
    // 末尾の句点を除去してからデフォルト値を付加
    let desc = prop.description.trim();
    if (prop.defaultValue !== undefined) {
      desc += `（デフォルト：\`${prop.defaultValue}\`）`;
    }
    return `| ${nameCell} | ${typeCell} | ${desc} |`;
  });
  return ["| Prop | 型 | 説明 |", "| --- | --- | --- |", ...rows].join("\n");
};

// ------
// markdown ファイル更新
// ------

/**
 * 見出し行からコンポーネント名を抽出する．
 * `` ### `<Figure>` `` のようにコンポーネントが 1 つのみ記載された見出しを対象とし，
 * `` #### `<H1>`，`<H2>` `` のような複数記載の行はスキップする（`null` を返す）．
 * @param line markdown の 1 行．
 */
const extractComponentName = (line: string): string | null => {
  const match = line.match(/^#{2,6}\s+`<([A-Za-z][A-Za-z0-9]*)>`\s*$/);
  return match ? match[1] : null;
};

/**
 * markdown ファイルの Props テーブルを TSDoc から生成したテーブルに置き換える．
 * 以下の方法で Props インターフェースを特定する：
 * - 単一コンポーネント見出し（`` ### `<Figure>` ``）：見出し名から自動判定
 * - `<!-- Props: HeadingProps -->` アノテーション：指定されたインターフェースを使用
 * @param mdPath 更新対象の markdown ファイルパス．
 * @param interfaces 全インターフェースのマップ．
 * @param typeRegistry 型レジストリ（外部型判定に使用）．
 * @returns ファイルが更新された場合は `true`．
 */
const updateMarkdown = (
  mdPath: string,
  interfaces: Map<string, InterfaceInfo>,
  typeRegistry: TypeRegistry,
): boolean => {
  const content = fs.readFileSync(mdPath, "utf-8");
  const lines = content.split("\n");
  const result: string[] = [];
  let changed = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 見出し行でなければそのまま出力
    if (!line.match(/^#{2,6}\s/)) {
      result.push(line);
      i++;
      continue;
    }

    // 見出し行：単一コンポーネントなら名前から Props を特定
    const componentName = extractComponentName(line);
    let info = componentName ? interfaces.get(componentName) : undefined;

    result.push(line);
    i++;

    // 見出しとテーブル（または次の見出し）の間の行を収集する．
    // `<!-- Props: InterfaceName -->` アノテーションも検出する．
    const before: string[] = [];
    while (
      i < lines.length &&
      !lines[i].startsWith("|") &&
      !lines[i].match(/^#{2,6}\s/)
    ) {
      if (info === undefined) {
        const annotationMatch = lines[i].match(
          /^<!--\s*Props:\s*(\w+Props)\s*-->/,
        );
        if (annotationMatch) {
          const annotatedComponent = annotationMatch[1].slice(
            0,
            -"Props".length,
          );
          info = interfaces.get(annotatedComponent);
        }
      }
      before.push(lines[i]);
      i++;
    }

    const props =
      info && !hasExternalExtends(info, interfaces, typeRegistry)
        ? info.props
        : undefined;

    result.push(...before);

    if (
      props !== undefined &&
      props.length > 0 &&
      i < lines.length &&
      lines[i].startsWith("|")
    ) {
      // 既存テーブルの行をすべて読み飛ばして生成テーブルに置換
      const oldLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        oldLines.push(lines[i]);
        i++;
      }
      const newTable = generateTable(props);
      result.push(newTable);
      if (oldLines.join("\n") !== newTable) {
        changed = true;
      }
    }
  }

  const newContent = result.join("\n");
  if (newContent !== content) {
    fs.writeFileSync(mdPath, newContent, "utf-8");
    return true;
  }
  return changed;
};

/**
 * エントリポイント．
 */
const main = () => {
  const srcDir = path.join(ROOT, "src/components");
  const docsDir = path.join(ROOT, "docs/components");
  const minitypeSrcDir = path.join(ROOT, "../minitype/src");

  console.log("Parsing TypeScript interfaces...");
  const { interfaces, typeRegistry } = parseInterfaces(srcDir, [
    minitypeSrcDir,
  ]);
  const autoGenCount = [...interfaces.values()].filter(
    (info) => !hasExternalExtends(info, interfaces, typeRegistry),
  ).length;
  console.log(
    `Found ${interfaces.size} Props interfaces (${autoGenCount} auto-generated, ${interfaces.size - autoGenCount} skipped due to external extends).`,
  );

  const mdFiles = fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(docsDir, f));

  let updatedCount = 0;
  for (const mdFile of mdFiles) {
    const updated = updateMarkdown(mdFile, interfaces, typeRegistry);
    const label = path.basename(mdFile);
    if (updated) {
      console.log(`Updated: ${label}`);
      updatedCount++;
    } else {
      console.log(`No changes: ${label}`);
    }
  }

  console.log(
    updatedCount > 0
      ? `Done. ${updatedCount} file(s) updated.`
      : "Done. All files are up to date.",
  );
};

main();
