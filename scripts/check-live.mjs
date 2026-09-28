// Fails when placeholder business details are still present. Run before any production deploy.
import { readFileSync } from "node:fs";
import { findPlaceholders } from "./placeholders.mjs";

const files = ["src/data/site.ts", "astro.config.mjs"];
const problems = files.flatMap((f) => findPlaceholders(readFileSync(f, "utf8")).map((m) => `${f}: contains "${m}"`));

if (problems.length) {
  console.error("Placeholder details found — replace them before deploying:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log("No placeholders found.");
