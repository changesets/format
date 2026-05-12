import cp from "node:child_process";
import dns from "node:dns/promises";
import path from "node:path";
import { createFixture } from "fs-fixture";
import { expect, test } from "vitest";
import { detect, format, type FormatterName } from "../src/index.ts";

function canRunDeno() {
  return new Promise<boolean>((resolve) => {
    const proc = cp.spawn("deno", ["--version"]);
    proc.on("error", () => resolve(false));
    proc.on("exit", (code) => resolve(code === 0));
  });
}

// dprint requires an internet connection to download plugins (on the first run)
async function canRunDprint() {
  try {
    await dns.lookup("plugins.dprint.dev");
    return true;
  } catch {
    return false;
  }
}

const cases: FormatterName[] = ["biome", "deno", "dprint", "oxfmt", "prettier"];

test.for(cases)("detect and format %s fixture", async (name, ctx) => {
  // Optionally skip some tests locally if the formatter isn't properly installed,
  // but always run in CI
  if (!process.env.CI) {
    if (name === "deno" && !(await canRunDeno())) {
      ctx.skip("deno is not installed");
    }
    if (name === "dprint" && !(await canRunDprint())) {
      ctx.skip("no internet connection for dprint plugin download");
    }
  }

  const fixtureTemplateDir = path.join(import.meta.dirname, "fixtures", name);
  await using fixture = await createFixture(fixtureTemplateDir);
  await fixture.writeFile("file.ts", "let x=1;");

  const detectResult = await detect({ cwd: fixture.path });
  expect(detectResult).toBe(name);

  const formatResult = await format(["file.ts"], { cwd: fixture.path, formatter: name });
  expect(formatResult).toBe(true);
  expect(await fixture.readFile("file.ts", "utf-8")).toMatchSnapshot();
});
