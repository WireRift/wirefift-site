import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const config = process.env.UI_AUDIT_PREVIEW_URL
  ? ["--config", ".temp_files/audit-preview.config.ts"]
  : [];
const result = spawnSync(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "tests/design-quality.spec.ts",
    "--grep",
    "regression|inspector|typography",
    "--workers=2",
    "--reporter=line",
    ...config,
  ],
  { encoding: "utf8", windowsHide: true, timeout: 180000 },
);
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
appendFileSync(
  new URL("./ui-proof-runs.log", import.meta.url),
  `\n${new Date().toISOString()}\n${output}`,
);
process.stdout.write(output);
console.log(
  "EXPECTED: bounded search, restored focus, legible header, current-request clipboard state, requested fonts.",
);
console.log(`ACTUAL: test runner exit ${result.status}`);
console.log(
  result.status === 0
    ? "PROBLEM NOT REPRODUCED"
    : output.includes("expect(")
      ? "PROBLEM CONFIRMED"
      : "VERIFICATION BLOCKED",
);
process.exit(result.status ?? 1);
