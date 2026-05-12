import path from "node:path";
import { detect as detectPackageManager, type Agent } from "package-manager-detector";
import { detect } from "./detect.ts";
import { formatters, type FormatterFormatContext, type FormatterName } from "./formatters.ts";

export interface FormatOptions {
  /**
   * The formatter to use for formatting. It not specified, it will be auto-detected using
   * {@link detect}. Use {@link detect} directly if you want to have more control over the
   * detection process.
   */
  formatter?: FormatterName;
  /**
   * The current working directory to start looking up for the formatter and package manager,
   * and to execute the formatter's command from.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * The path to stop traversing up the directory.
   */
  stopDir?: string;
  /**
   * The package manager to use for executing the formatter's command. If not specified, it will use
   * `package-manager-detector` to detect the package manager.
   */
  packageManager?: Agent;
}

/**
 * Format the given patterns with a specified or auto-detected formatter. It returns `true` if a
 * formatter is found and the formatting process passes, otherwise returns `false`.
 */
export async function format(patterns: string[], options: FormatOptions = {}): Promise<boolean> {
  const formatterName =
    options.formatter ??
    (await detect({
      cwd: options.cwd,
      stopDir: options.stopDir,
    }));
  if (!formatterName) return false;

  const formatter = formatters[formatterName];
  const ctx: FormatterFormatContext = {
    cwd: options.cwd ? path.resolve(options.cwd) : process.cwd(),
    async getPackageManager() {
      if (options.packageManager) return options.packageManager;
      const detected = await detectPackageManager({ cwd: options.cwd, stopDir: options.stopDir });
      return detected?.agent ?? "npm";
    },
  };
  await formatter.format(patterns, ctx);

  return true;
}
