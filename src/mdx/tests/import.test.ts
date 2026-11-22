/**
 * Copyright (c) 2026 Yuto Wada.
 * Released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";
import { evaluateMdxString } from "../evaluate.js";

it("MDX のパッケージ import が記事の位置から解決される", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "minitype-mdx-"));
  try {
    const packageDir = path.join(directory, "node_modules", "mdx-test-package");
    await mkdir(packageDir, { recursive: true });
    await writeFile(
      path.join(packageDir, "package.json"),
      JSON.stringify({ type: "module", exports: "./index.js" }),
    );
    await writeFile(
      path.join(packageDir, "index.js"),
      'export const message = "resolved from article";',
    );
    const { blocks } = await evaluateMdxString(
      'import { message } from "mdx-test-package";\n\n{message}',
      { baseUrl: pathToFileURL(path.join(directory, "article.mdx")) },
    );
    expect(blocks).toEqual(["resolved from article"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
