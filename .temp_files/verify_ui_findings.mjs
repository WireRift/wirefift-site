import { spawnSync } from "node:child_process";

for (let run = 1; run <= 3; run++) {
  const result = spawnSync(
    process.execPath,
    [".temp_files/prove_ui_findings.mjs"],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`FIX VERIFIED (${run}/3)`);
}
