import { createFixture } from "fs-fixture";
import { expect, test, vi } from "vitest";
import { format, type FormatterName } from "../src/index.ts";

const mocks = vi.hoisted(() => ({
  spawn: vi.fn().mockReturnValue({
    // mock the bare-minimum based on how `src/utils.ts` uses `spawn`
    on: (eventName: string, listener: Function) => {
      if (eventName === "exit") {
        listener(0); // simulate successful exit
      }
    },
    stderr: { on: () => {} },
  }),
}));

vi.mock(import("node:child_process"), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    spawn: mocks.spawn,
    default: {
      ...mod.default,
      spawn: mocks.spawn,
    },
  };
});

const cases: { formatter: FormatterName; expectedCommand: string[] }[] = [
  { formatter: "prettier", expectedCommand: ["npx", "prettier", "--write", "file.ts"] },
  {
    formatter: "biome",
    expectedCommand: ["npx", "@biomejs/biome", "format", "--write", "file.ts"],
  },
  { formatter: "oxfmt", expectedCommand: ["npx", "oxfmt", "--write", "file.ts"] },
  { formatter: "deno", expectedCommand: ["deno", "fmt", "file.ts"] },
  { formatter: "dprint", expectedCommand: ["npx", "dprint", "fmt", "file.ts"] },
];

for (const c of cases) {
  test(`executes the correct command for ${c.formatter}`, async () => {
    await using fixture = await createFixture({});
    const result = await format(["file.ts"], { cwd: fixture.path, formatter: c.formatter });
    expect(result).toBe(true);
    const [command, ...args] = c.expectedCommand;
    expect(mocks.spawn).toHaveBeenCalledWith(command, args, { cwd: fixture.path });
  });
}
