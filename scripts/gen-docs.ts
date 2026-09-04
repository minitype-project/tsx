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
}

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
  // `/**` と `*/` を除去して各行を正規る
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
 * TypeScript ソースファイルから `*Props` インターフェースを解析する．
 * 継承元のフィールドは含めず，当該インターフェースで直接宣言されたフィールドのみを返す．
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
    if (!ifaceMatch) {
      i++;
      continue;
    }

    // `FigureProps` → `Figure` のようにコンポーネント名を取り出す
    const componentName = ifaceMatch[1].slice(0, -"Props".length);

    // `extends Foo, Bar<Baz>` のような extends 句から親名を抽出する．
    // ジェネリクス（`<...>`）は除去して名前だけ残す．
    const extendsMatch = ifaceMatch[2].match(/extends\s+([\w,\s<>]+)/);
    const extendsNames = extendsMatch
      ? extendsMatch[1].split(",").map((s) => s.trim().replace(/<.*$/, ""))
      : [];

    i++;

    const props: PropInfo[] = [];
    // 直前の JSDoc ブロックを一時保存する変数
    let pendingJSDoc: string | null = null;

    // 閉じ括弧 `}` まで 1 行ずつパース
    while (i < lines.length) {
      const trimmed = lines[i].trim();

      if (trimmed === "}" || trimmed === "};") {
        break;
      }

      // JSDoc の収集：単行（`/** ... */`）と複数行の両方に対応
      if (trimmed.startsWith("/**")) {
        if (trimmed.endsWith("*/")) {
          // 単行 JSDoc
          pendingJSDoc = trimmed;
          i++;
        } else {
          // 複数行 JSDoc：`*/` で終わる行まで収集
          const jsDocLines = [trimmed];
          i++;
          while (i < lines.length && !lines[i].trim().endsWith("*/")) {
            jsDocLines.push(lines[i].trim());
            i++;
          }
          jsDocLines.push(lines[i].trim()); // 閉じる `*/` の行
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

    result.set(componentName, { props, extendsNames });
    i++; // 閉じ括弧 `}` をスキップ
  }

  return result;
};

/**
 * `src/components/` 配下のすべての `.ts` ファイルから `*Props` インターフェースを収集する．
 * @param srcDir コンポーネントソースのディレクトリパス．
 */
const parseInterfaces = (srcDir: string): Map<string, InterfaceInfo> => {
  const result = new Map<string, InterfaceInfo>();

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join(srcDir, f));

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf-8");
    for (const [name, info] of parseSourceFile(source)) {
      result.set(name, info);
    }
  }

  return result;
};

/**
 * `extends` 句にプロジェクト外の型（`*Props` ではない，またはマップに存在しない）が含まれているかを判定する．
 * 外部型を継承している場合，継承フィールドをスクリプトで把握できないためテーブル自動生成をスキップする．
 * @param info 判定対象のインターフェース情報．
 * @param allInterfaces 全インターフェースのマップ（親の存在確認に使用）．
 */
const hasExternalExtends = (
  info: InterfaceInfo,
  allInterfaces: Map<string, InterfaceInfo>,
): boolean => {
  return info.extendsNames.some((parent) => {
    // `*Props` で終わらない名前は外部型とみなす（例：`BackgroundImageOptions`）
    if (!parent.endsWith("Props")) {
      return true;
    }
    // `*Props` であっても，マップに存在しなければ外部型とみなす
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
 * `` #### `<H1>` `<H2>` `` のような複数記載の行はスキップする（`null` を返す）．
 * @param line markdown の 1 行．
 */
const extractComponentName = (line: string): string | null => {
  const match = line.match(/^#{2,6}\s+`<([A-Za-z][A-Za-z0-9]*)>`\s*$/);
  return match ? match[1] : null;
};

/**
 * markdown ファイルの Props テーブルを TSDoc から生成したテーブルに置き換える．
 * 以下の条件に当てはまるコンポーネントの見出し直後のテーブルのみを更新する：
 * - 対応する `*Props` インターフェースがマップに存在する
 * - `extends` 句に外部型を含まない
 * - Props が 1 件以上ある
 * @param mdPath 更新対象の markdown ファイルパス．
 * @param interfaces 全インターフェースのマップ．
 * @returns ファイルが更新された場合は `true`．
 */
const updateMarkdown = (
  mdPath: string,
  interfaces: Map<string, InterfaceInfo>,
): boolean => {
  const content = fs.readFileSync(mdPath, "utf-8");
  const lines = content.split("\n");
  const result: string[] = [];
  let changed = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const componentName = extractComponentName(line);
    const info = componentName ? interfaces.get(componentName) : undefined;

    // 外部型を継承するインターフェースは手動管理のためスキップ
    const props =
      info && !hasExternalExtends(info, interfaces) ? info.props : undefined;

    if (props !== undefined && props.length > 0) {
      result.push(line);
      i++;

      // 見出しの直後からテーブル（`|` で始まる行）または次の見出しが来るまで，説明文などの非テーブル行をそのまま収集
      const before: string[] = [];
      while (
        i < lines.length &&
        !lines[i].startsWith("|") &&
        !lines[i].match(/^#{2,6}\s/)
      ) {
        before.push(lines[i]);
        i++;
      }
      result.push(...before);

      if (i < lines.length && lines[i].startsWith("|")) {
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
    } else {
      result.push(line);
      i++;
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

  console.log("Parsing TypeScript interfaces...");
  const interfaces = parseInterfaces(srcDir);
  const autoGenCount = [...interfaces.values()].filter(
    (info) => !hasExternalExtends(info, interfaces),
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
    const updated = updateMarkdown(mdFile, interfaces);
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
