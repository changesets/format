import fs from "node:fs";
import path from "node:path";
import { formatters, type FormatterName } from "./formatters.ts";
import { traverseUpwards } from "./utils.ts";

export const defaultDetectOrder: readonly FormatterName[] = Object.freeze([
  "dprint",
  "deno",
  "oxfmt",
  "biome",
  "prettier",
]);

export interface DetectOptions {
  /**
   * The current working directory to start looking up for the formatter.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * The path to stop traversing up the directory.
   */
  stopDir?: string;
  /**
   * The order of formatters to check for.
   * @default ["dprint", "deno", "oxfmt", "biome", "prettier"] // from `defaultDetectOrder`
   */
  order?: FormatterName[];
}

/**
 * Detect the preferred formatter used in the project.
 */
// NOTE: It's much faster to use sync fs when performing them in a loop, but we still keep this
// function async in case we need to perform async work in the future.
export async function detect(options: DetectOptions = {}): Promise<FormatterName | undefined> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const stopDir = options.stopDir ? path.resolve(cwd, options.stopDir) : undefined;
  const order = options.order ?? defaultDetectOrder;

  // Look up formatter config files
  let found = traverseUpwards<FormatterName>(cwd, stopDir, (dir) => {
    for (const formatterName of order) {
      const formatter = formatters[formatterName];
      for (const configFile of formatter.configFiles) {
        if (typeof configFile === "string") {
          const configFilePath = path.join(dir, configFile);
          if (fs.existsSync(configFilePath)) {
            return formatter.name;
          }
        } else {
          const configFilePath = path.join(dir, configFile.file);
          if (checkConfigFileWithKeyExists(configFilePath, configFile.key)) {
            return formatter.name;
          }
        }
      }
    }
  });

  // Look up formatter package in node_modules
  found ??= traverseUpwards<FormatterName>(cwd, stopDir, (dir) => {
    for (const formatterName of order) {
      const formatter = formatters[formatterName];
      if (formatter.packageName) {
        const packagePath = path.join(dir, "node_modules", formatter.packageName);
        if (fs.existsSync(packagePath)) {
          return formatter.name;
        }
      }
    }
  });

  return found;
}

function checkConfigFileWithKeyExists(configFile: string, key: string): boolean {
  try {
    const content = fs.readFileSync(configFile, "utf-8");
    const json = JSON.parse(content);
    return key in json;
  } catch {
    return false;
  }
}
