import type { Agent } from "package-manager-detector";
import { packageManagerExecute, spawnProcess } from "./utils.ts";

export type FormatterName = "prettier" | "biome" | "oxfmt" | "deno" | "dprint";

export interface ConfigFileWithKey {
  file: string;
  key: string;
}

export interface FormatterFormatContext {
  cwd: string;
  getPackageManager(): Promise<Agent>;
}

export interface Formatter {
  name: FormatterName;
  /**
   * The formatter's main npm package name, used to find the formatter in node_modules
   */
  packageName?: string;
  /**
   * The formatter's config files
   */
  configFiles: (string | ConfigFileWithKey)[];
  format: (patterns: string[], ctx: FormatterFormatContext) => Promise<void>;
}

const prettier: Formatter = {
  name: "prettier",
  packageName: "prettier",
  // https://prettier.io/docs/configuration
  configFiles: [
    ".prettierrc",
    // standard
    ".prettierrc.json",
    ".prettierrc.yml",
    ".prettierrc.yaml",
    ".prettierrc.json5",
    // js
    ".prettierrc.js",
    "prettier.config.js",
    ".prettierrc.ts",
    "prettier.config.ts",
    // mjs
    ".prettierrc.mjs",
    "prettier.config.mjs",
    ".prettierrc.mts",
    "prettier.config.mts",
    // cjs
    ".prettierrc.cjs",
    "prettier.config.cjs",
    ".prettierrc.cts",
    "prettier.config.cts",
    // others
    ".prettierrc.toml",
    { file: "package.json", key: "prettier" },
  ],
  async format(files, ctx) {
    const pm = await ctx.getPackageManager();
    await packageManagerExecute(pm, ["prettier", "--write", ...files], ctx.cwd);
  },
};

const biome: Formatter = {
  name: "biome",
  packageName: "@biomejs/biome",
  // https://biomejs.dev/guides/configure-biome/
  configFiles: ["biome.json", "biome.jsonc", ".biome.json", ".biome.jsonc"],
  async format(files, ctx) {
    const pm = await ctx.getPackageManager();
    await packageManagerExecute(pm, ["@biomejs/biome", "format", "--write", ...files], ctx.cwd);
  },
};

const oxfmt: Formatter = {
  name: "oxfmt",
  packageName: "oxfmt",
  // https://oxc.rs/docs/guide/usage/formatter/config.html
  configFiles: [".oxfmtrc.json", ".oxfmtrc.jsonc", "oxfmt.config.ts"],
  async format(files, ctx) {
    const pm = await ctx.getPackageManager();
    await packageManagerExecute(pm, ["oxfmt", "--write", ...files], ctx.cwd);
  },
};

const deno: Formatter = {
  name: "deno",
  // https://docs.deno.com/runtime/reference/cli/fmt/#configuring-the-formatter
  configFiles: ["deno.json", "deno.jsonc", { file: "deno.json", key: "fmt" }],
  async format(files, ctx) {
    await spawnProcess("deno", ["fmt", ...files], ctx.cwd);
  },
};

const dprint: Formatter = {
  name: "dprint",
  packageName: "dprint",
  // https://dprint.dev/configuration/
  configFiles: ["dprint.json", "dprint.jsonc", ".dprint.json", ".dprint.jsonc"],
  async format(files, ctx) {
    // NOTE: dprint could be installed in many ways globally, but for all the tools here, we assume
    // that they're installed locally in node_modules for now.
    const pm = await ctx.getPackageManager();
    await packageManagerExecute(pm, ["dprint", "fmt", ...files], ctx.cwd);
  },
};

export const formatters: Record<FormatterName, Formatter> = {
  prettier,
  biome,
  oxfmt,
  deno,
  dprint,
};
