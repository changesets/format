import { createFixture, type FileTree } from "fs-fixture";
import { expect, test } from "vitest";
import { detect } from "../src/detect.ts";

test("stop searching when reaching the stopDir", async () => {
  await using fixture = await createFixture({
    ".prettierrc": "",
    "nested/biome.json": "",
  });
  const result = await detect({ cwd: fixture.getPath("nested"), stopDir: fixture.path });
  expect(result).toBe("biome");
});

test("respect the order of formatters", async () => {
  await using fixture = await createFixture({
    ".prettierrc": "",
    "biome.json": "",
  });
  const result = await detect({ cwd: fixture.path, order: ["biome", "prettier"] });
  expect(result).toBe("biome");
  const result2 = await detect({ cwd: fixture.path, order: ["prettier", "biome"] });
  expect(result2).toBe("prettier");
});

const cases: { name: string; files: FileTree; expected: string }[] = [
  // config files
  { name: "config", files: { ".prettierrc": "" }, expected: "prettier" },
  {
    name: "package.json",
    files: { "package.json": JSON.stringify({ prettier: {} }) },
    expected: "prettier",
  },
  { name: "config", files: { "biome.json": "" }, expected: "biome" },
  { name: "config", files: { ".oxfmtrc.json": "" }, expected: "oxfmt" },
  { name: "config", files: { "deno.json": JSON.stringify({ fmt: {} }) }, expected: "deno" },
  { name: "config", files: { "dprint.json": "" }, expected: "dprint" },
  // node_modules
  {
    name: "node_modules",
    files: { "node_modules/prettier/package.json": "" },
    expected: "prettier",
  },
  {
    name: "node_modules",
    files: { "node_modules/@biomejs/biome/package.json": "" },
    expected: "biome",
  },
  { name: "node_modules", files: { "node_modules/oxfmt/package.json": "" }, expected: "oxfmt" },
];

for (const c of cases) {
  test(`detect ${c.expected} via ${c.name}`, async () => {
    await using fixture = await createFixture(c.files);
    const result = await detect({ cwd: fixture.path });
    expect(result).toBe(c.expected);
  });
}
