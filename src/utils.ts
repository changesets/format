import path from "node:path";
import { resolveCommand, type Agent } from "package-manager-detector";
import { exec } from "tinyexec";

/**
 * Traverse upwards from `startDir` to `stopDir` (inclusive), calling `cb` in each directory. If
 * `cb` returns a non-null value, it'll stop and return that value.
 */
export function traverseUpwards<T>(
  startDir: string,
  stopDir: string | undefined,
  cb: (dir: string) => T | undefined,
): T | undefined {
  let dir = startDir;

  while (dir) {
    const result = cb(dir);
    if (result !== undefined) return result;

    if (dir === stopDir) break;

    const nextDir = path.dirname(dir);
    if (nextDir === dir) break;
    dir = nextDir;
  }

  return undefined;
}

export async function packageManagerExecute(
  packageManager: Agent,
  args: string[],
  cwd: string,
): Promise<void> {
  const cmd = resolveCommand(packageManager, "execute-local", args) ?? { command: "npx", args };
  return await spawnProcess(cmd.command, cmd.args, cwd);
}

export async function spawnProcess(command: string, args: string[], cwd: string): Promise<void> {
  await exec(command, args, {
    nodeOptions: { cwd },
    throwOnError: true,
  });
}
