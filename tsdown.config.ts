import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  dts: true,
  format: "esm",
  minify: "dce-only",
  platform: "node",
  fixedExtension: false,
});
