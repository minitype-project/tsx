/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { readFile } from "node:fs/promises";
import { createRequire, isBuiltin } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { JsxElement } from "./jsx-runtime.js";
import { Fragment, jsx } from "./jsx-runtime.js";
import { remarkCjkAutolink } from "./mdx-autolink.js";
import {
  defaultComponents,
  filterWhitespace,
  remarkPreserveCodeMeta,
  remarkSplitLooseList,
  resolveListBlocks,
  splitSrcQuery,
} from "./mdx-components.js";

// ------
// 定数
// ------

/**
 * URL スキーム（`https:`，`file:` 等）で始まる文字列にマッチする正規表現．
 */
const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * `src` にファイルパスを受け取るコンポーネントのキー．
 */
const ASSET_COMPONENT_KEYS = [
  "img",
  "Image",
  "Figure",
  "BackgroundImage",
  "InlineGraphic",
  "LstInputlisting",
  "MdFile",
  "StaticBibliographyFile",
];

// ------
// 型定義
// ------

/**
 * MDX コンポーネントマッピングの型．
 * デフォルトのマッピングをキーごとに上書きできる．
 */
export type MdxComponents = typeof defaultComponents;

/**
 * ユーザが `components` に追加できるコンポーネント関数の型．
 * 任意の props 型を受け付けるよう `any` を使用している．
 */
type ComponentFn = (props: any) => JsxElement;

type EvaluateOptions = Parameters<typeof evaluate>[1];

/**
 * {@link evaluateMdxString}，{@link evaluateMdxFile} のオプション．
 */
export interface EvaluateMdxOptions {
  /**
   * デフォルトの HTML タグ→コンポーネントマッピングを上書きする，
   * またはカスタムコンポーネントを追加する．
   * 指定したキーのみ置き換えられ，その他はデフォルトのままになる．
   */
  components?: Partial<{ [K in keyof MdxComponents]: ComponentFn }> &
    Record<string, ComponentFn>;
  /**
   * MDX 内の `import` 文を解決するためのベース URL．
   * 指定すると MDX ファイル内で `import { cmyk } from "@minitype/minitype"` 等が使用できる．
   * {@link evaluateMdxFile} では自動的にファイルパスから設定される．
   *
   * また，画像などのコンポーネントの `src` に指定した相対パスは，このファイルの位置から解決される
   * （{@link resolveAsset} を参照）．
   */
  baseUrl?: string | URL;
  /**
   * `baseUrl` の指定時に，`img`・`Image`・`Figure` 等の `src` に指定された相対パスを解決する関数．
   * 絶対パスや `https:` 等のスキームを持つ値，クエリ（`?ratio=0.5` 等）は渡されない．
   * 省略時は `baseUrl` が `file:` URL の場合に限り，そのディレクトリからの相対パスとして解決する．
   */
  resolveAsset?: (src: string, baseUrl: URL) => string;
}

/**
 * {@link evaluateMdxString}，{@link evaluateMdxFile} の戻り値型．
 */
export interface MdxResult {
  /** 組版に使用するブロック要素の配列． */
  blocks: JsxElement;
  /** YAML フロントマターの内容． */
  frontmatter: Record<string, unknown>;
}

// ------
// 内部 API
// ------

/**
 * `components` に含まれる文字列キーを参照して呼び出す JSX ファクトリを生成する．
 * MDX が raw HTML タグを文字列型（`"sup"` 等）で渡す場合に対応する．
 */
const createMdxJsx = (components: Record<string, (props: any) => unknown>) => {
  return (
    type: ((props: Record<string, unknown>) => JsxElement) | symbol | string,
    props: Record<string, unknown>,
    _key?: string,
  ): JsxElement => {
    if (typeof type === "string") {
      const component = components[type];
      if (component) {
        return component(props) as JsxElement;
      }
      throw new Error(`Unsupported JSX element type: ${type}`);
    }
    return jsx(type as Parameters<typeof jsx>[0], props, _key);
  };
};

/**
 * `baseUrl` が `file:` URL の場合に，そのディレクトリからの相対パスとして `src` を解決する．
 */
const defaultResolveAsset = (src: string, baseUrl: URL): string => {
  if (baseUrl.protocol !== "file:") {
    return src;
  }
  return path.resolve(path.dirname(fileURLToPath(baseUrl)), src);
};

/**
 * `components` のうち {@link ASSET_COMPONENT_KEYS} に含まれるものを，
 * `src` の相対パスを解決してから呼び出すようにラップする．
 */
const withAssetResolution = (
  components: Record<string, (props: any) => unknown>,
  baseUrl: URL,
  resolveAsset: (src: string, baseUrl: URL) => string,
) => {
  const resolveSrc = (src: string): string => {
    if (!src || path.isAbsolute(src) || URL_SCHEME.test(src)) {
      return src;
    }
    const { pathname, search } = splitSrcQuery(src);
    return `${resolveAsset(pathname, baseUrl)}${search}`;
  };
  const wrapped = { ...components };
  for (const key of ASSET_COMPONENT_KEYS) {
    const component = components[key];
    if (component) {
      wrapped[key] = (props: Record<string, unknown>) =>
        component(
          typeof props.src === "string"
            ? { ...props, src: resolveSrc(props.src) }
            : props,
        );
    }
  }
  return wrapped;
};

/**
 * MDX 内のパッケージ import を記事の位置から解決する．
 * 評価関数が置かれた依存パッケージからの相対解決を避ける．
 */
const resolveMdxImports = (baseUrl: string | URL) => {
  const require = createRequire(baseUrl);
  return () => (tree: unknown) => {
    const visit = (value: unknown): void => {
      if (!value || typeof value !== "object") {
        return;
      }
      const node = value as Record<string, unknown>;
      if (node.type === "ImportExpression") {
        const source = node.source as Record<string, unknown>;
        const literal =
          source.type === "CallExpression"
            ? (source.arguments as Record<string, unknown>[])[0]
            : source;
        const specifier = literal?.value;
        if (
          typeof specifier === "string" &&
          !/^[./]/.test(specifier) &&
          !URL_SCHEME.test(specifier) &&
          !isBuiltin(specifier)
        ) {
          literal.value = pathToFileURL(require.resolve(specifier)).href;
          delete literal.raw;
        }
      }
      for (const child of Object.values(node)) {
        if (Array.isArray(child)) {
          child.forEach(visit);
        } else {
          visit(child);
        }
      }
    };
    visit(tree);
  };
};

// ------
// 公開 API
// ------

/**
 * MDX 文字列を評価して，ブロック要素とフロントマターを返す．
 * 結果の `blocks` は `<Group>` などのブロックコンテキストで使用できる．
 */
export const evaluateMdxString = async (
  content: string,
  options?: EvaluateMdxOptions,
): Promise<MdxResult> => {
  const baseUrl =
    options?.baseUrl !== undefined ? new URL(options.baseUrl) : undefined;
  const merged = { ...defaultComponents, ...options?.components };
  const components = baseUrl
    ? withAssetResolution(
        merged,
        baseUrl,
        options?.resolveAsset ?? defaultResolveAsset,
      )
    : merged;
  const mdxJsx = createMdxJsx(components) as unknown as EvaluateOptions["jsx"];

  const { default: Content, frontmatter } = (await evaluate(content, {
    jsx: mdxJsx,
    jsxs: mdxJsx,
    Fragment,
    development: false,
    remarkPlugins: [
      remarkSplitLooseList,
      remarkPreserveCodeMeta,
      remarkGfm,
      remarkCjkAutolink,
      remarkMath,
      remarkFrontmatter,
      remarkMdxFrontmatter,
    ],
    ...(options?.baseUrl !== undefined && {
      baseUrl: options.baseUrl,
      recmaPlugins: [resolveMdxImports(options.baseUrl)],
    }),
  } as EvaluateOptions)) as {
    default: unknown;
    frontmatter?: Record<string, unknown>;
  };

  const blocks = (
    Content as (props: { components: typeof components }) => JsxElement
  )({
    components,
  });

  return {
    blocks: resolveListBlocks(filterWhitespace(blocks)) as JsxElement,
    frontmatter: frontmatter ?? {},
  };
};

/**
 * MDX ファイルを読み込み評価して，ブロック要素の配列を返す．
 * 結果は `<Group>` などのブロックコンテキストで使用できる．
 */
export const evaluateMdxFile = async (
  filePath: string,
  options?: EvaluateMdxOptions,
): Promise<MdxResult> => {
  const content = await readFile(filePath, "utf-8");
  const baseUrl = options?.baseUrl ?? pathToFileURL(filePath);
  return evaluateMdxString(content, { ...options, baseUrl });
};
