/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { evaluateMdxString } from "../mdx.js";

const baseUrl = pathToFileURL("/articles/foo/article.mdx");

/**
 * MDX を評価して，`img` と `Image` に渡された `src` を返す．
 */
const collectSrc = async (
  md: string,
  options?: Parameters<typeof evaluateMdxString>[1],
): Promise<string[]> => {
  const srcs: string[] = [];
  const capture = ({ src }: { src: string }) => {
    srcs.push(src);
    return null;
  };
  await evaluateMdxString(md, {
    ...options,
    components: { img: capture, Image: capture },
  });
  return srcs;
};

describe("src の相対パスの解決", () => {
  it("baseUrl のディレクトリからの相対パスとして解決する", async () => {
    expect(
      await collectSrc('![](./a.png)\n\n<Image src="b/c.png" />', {
        baseUrl,
      }),
    ).toEqual(["/articles/foo/a.png", "/articles/foo/b/c.png"]);
  });

  it("絶対パス，URL はそのまま渡す", async () => {
    expect(
      await collectSrc(
        '<Image src="/abs.png" />\n\n<Image src="https://example.com/a.png" />',
        { baseUrl },
      ),
    ).toEqual(["/abs.png", "https://example.com/a.png"]);
  });

  it("baseUrl を指定しない場合は解決しない", async () => {
    expect(await collectSrc("![](a.png)")).toEqual(["a.png"]);
  });

  it("resolveAsset で解決方法を置き換えられる", async () => {
    expect(
      await collectSrc("![](a.png)", {
        baseUrl,
        resolveAsset: (src, base) => `${base.protocol}${src}`,
      }),
    ).toEqual(["file:a.png"]);
  });

  it("resolveAsset にはクエリを除いたパスを渡し，クエリは解決後に付け直す", async () => {
    const received: string[] = [];
    expect(
      await collectSrc("![](a.png?ratio=0.5)", {
        baseUrl,
        resolveAsset: (src) => {
          received.push(src);
          return `/resolved/${src}`;
        },
      }),
    ).toEqual(["/resolved/a.png?ratio=0.5"]);
    expect(received).toEqual(["a.png"]);
  });
});
