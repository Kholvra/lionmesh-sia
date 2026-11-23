#!/usr/bin/env node
// Runs FND-004 core and approval checks against the same disposable database.

import { spawnSync } from "node:child_process";

for (const script of [
  "scripts/verify-fnd-004-core.mjs",
  "scripts/verify-fnd-004-approval.mjs",
]) {
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
