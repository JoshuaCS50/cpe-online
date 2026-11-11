#!/usr/bin/env node
// Sends one work-package brief to the hosted free model through opencode.
//
// Usage: node scripts/ds-run.mjs <brief.md> <worktree-dir> [model]
//
// Safety steps, in order:
//   1. The brief must pass scripts/brief-scan.mjs.
//   2. opencode runs with the worktree as its working directory. The
//      repository's opencode.json denies shell commands other than the test,
//      typecheck, lint and build scripts, denies web access and directories
//      outside the worktree, and disables every MCP server.
//   3. Nothing is committed here. The orchestrator reviews the diff first.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const [briefArg, worktreeArg, model = "opencode/deepseek-v4.1-flash-free"] = process.argv.slice(2);
if (!briefArg || !worktreeArg) {
  console.error("usage: ds-run.mjs <brief.md> <worktree-dir> [model]");
  process.exit(2);
}

const brief = resolve(briefArg);
const worktree = resolve(worktreeArg);
if (!existsSync(join(worktree, "opencode.json"))) {
  console.error(`No opencode.json in ${worktree}; refusing to run without the sandbox config.`);
  process.exit(2);
}

// The sandbox must be a standalone clone. opencode resolves a linked git
// worktree back to the main checkout and edits files there instead.
const gitDir = spawnSync("git", ["rev-parse", "--absolute-git-dir"], { cwd: worktree, encoding: "utf8" });
const expectedGitDir = join(worktree, ".git").replace(/\\/g, "/").toLowerCase();
if (gitDir.status !== 0 || gitDir.stdout.trim().replace(/\\/g, "/").toLowerCase() !== expectedGitDir) {
  console.error(`${worktree} is not a standalone clone (git dir: ${gitDir.stdout.trim()}). Use "git clone", not "git worktree add".`);
  process.exit(2);
}

const scan = spawnSync(process.execPath, [resolve("scripts/brief-scan.mjs"), brief], { stdio: "inherit" });
if (scan.status !== 0) process.exit(scan.status ?? 1);

copyFileSync(brief, join(worktree, "BRIEF.md"));

const message =
  "Read BRIEF.md in the repository root and carry out that work package exactly. " +
  "Touch only the files it lists. Do not edit BRIEF.md. Do not commit.";
const title = basename(brief).replace(/\.md$/, "");

const run = spawnSync("opencode", ["run", "--standalone", "-m", model, "--title", title, `"${message}"`], {
  cwd: worktree,
  // opencode takes its project directory from PWD when a POSIX shell set it,
  // so it must point at the sandbox too, not at the caller's directory.
  env: { ...process.env, PWD: worktree, INIT_CWD: worktree },
  stdio: "inherit",
  shell: true,
});

console.log("\n--- files changed in sandbox ---");
spawnSync("git", ["status", "--short"], { cwd: worktree, stdio: "inherit" });
process.exit(run.status ?? 1);
