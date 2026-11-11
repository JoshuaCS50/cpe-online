#!/usr/bin/env node
// Scans a work-package brief before it is sent to a hosted model.
// Fails (exit 1) if the brief contains anything that looks like a secret,
// personal data, or a path outside the repository.
//
// Usage: node scripts/brief-scan.mjs docs/briefs/P1-04-zip.md

import { readFileSync } from "node:fs";

const RULES = [
  ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["API key (sk-...)", /\bsk-[A-Za-z0-9_-]{16,}/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["bearer token", /\bBearer\s+[A-Za-z0-9._~+/-]{20,}/i],
  ["credential assignment", /\b(api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*["']?[^\s"']{8,}/i],
  ["email address", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ["Windows user path", /[A-Za-z]:[\\/]+Users[\\/]/i],
  ["Unix home path", /(^|[\s"'`(])(\/home\/|\/Users\/|~\/)/],
  ["course material folder", /Mechatronics|CPE TUTs|Past Papers/i],
  ["long base64 blob", /[A-Za-z0-9+/]{120,}={0,2}/],
];

const file = process.argv[2];
if (!file) {
  console.error("usage: brief-scan.mjs <brief.md>");
  process.exit(2);
}

const lines = readFileSync(file, "utf8").split(/\r?\n/);
const hits = [];
lines.forEach((line, index) => {
  for (const [label, pattern] of RULES) {
    if (pattern.test(line)) hits.push(`${file}:${index + 1}: ${label}`);
  }
});

if (hits.length > 0) {
  console.error("Brief rejected. Remove these before sending:\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`Brief clean: ${file} (${lines.length} lines, ${RULES.length} rules)`);
