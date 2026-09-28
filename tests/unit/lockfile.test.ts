import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// CI (GitHub Actions) and Cloudflare can only reach the public npm registry.
// Installs on a machine with a private mirror can write that mirror's URLs into the lockfile.
describe("package-lock.json", () => {
  it("resolves every package from the public npm registry", () => {
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const offenders = Object.entries(lock.packages as Record<string, { resolved?: string }>)
      .filter(([, p]) => p.resolved && !p.resolved.startsWith("https://registry.npmjs.org/"))
      .map(([name, p]) => `${name}: ${p.resolved}`);
    expect(offenders.slice(0, 5)).toEqual([]);
  });
});
