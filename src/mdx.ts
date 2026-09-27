/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { JsxElement } from "./jsx-runtime.js";
import { Fragment, jsx } from "./jsx-runtime.js";
import {
  defaultComponents,
  filterWhitespace,
  remarkPreserveCodeMeta,
  remarkSplitLooseList,
  resolveListBlocks,
} from "./mdx-components.js";

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
   */
  baseUrl?: string | URL;
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
// 公開 API
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
 * MDX 文字列を評価して，ブロック要素とフロントマターを返す．
 * 結果の `blocks` は `<Group>` などのブロックコンテキストで使用できる．
 */
export const evaluateMdxString = async (
  content: string,
  options?: EvaluateMdxOptions,
): Promise<MdxResult> => {
  const components = { ...defaultComponents, ...options?.components };
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
      remarkMath,
      remarkFrontmatter,
      remarkMdxFrontmatter,
    ],
    ...(options?.baseUrl !== undefined && { baseUrl: options.baseUrl }),
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
