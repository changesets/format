import { createFixture } from "fs-fixture";
import { expect, test, vi } from "vitest";
import { format, type FormatterName } from "../src/index.ts";

const mocks = vi.hoisted(() => ({
  exec: vi.fn().mockResolvedValue({ exitCode: 0, stderr: "", stdout: "" }),
}));

vi.mock(import("tinyexec"), () => ({ exec: mocks.exec }));

const cases: { formatter: FormatterName; expectedCommand: string[] }[] = [
  {
    formatter: "prettier",
    expectedCommand: ["npx", "prettier", "--write", "--no-error-on-unmatched-pattern", "file.ts"],
  },
  {
    formatter: "biome",
    expectedCommand: [
      "npx",
      "@biomejs/biome",
      "format",
      "--write",
      "--no-errors-on-unmatched",
      "file.ts",
    ],
  },
  {
    formatter: "oxfmt",
    expectedCommand: ["npx", "oxfmt", "--write", "--no-error-on-unmatched-pattern", "file.ts"],
  },
  {
    formatter: "deno",
    expectedCommand: ["deno", "fmt", "--permit-no-files", "file.ts"],
  },
  {
    formatter: "dprint",
    expectedCommand: ["npx", "dprint", "fmt", "--allow-no-files", "file.ts"],
  },
];

test.for(cases)("executes the correct command for $formatter", async (c) => {
  await using fixture = await createFixture();
  const result = await format(["file.ts"], { cwd: fixture.path, formatter: c.formatter });
  expect(result).toBe(true);
  const [command, ...args] = c.expectedCommand;
  expect(mocks.exec).toHaveBeenCalledWith(command, args, {
    nodeOptions: { cwd: fixture.path },
    throwOnError: true,
  });
});
