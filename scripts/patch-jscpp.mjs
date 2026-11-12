#!/usr/bin/env node
// Builds public/vendor/JSCPP.es5.min.js from the untouched upstream bundle in
// vendor-src/, with two behaviour changes: input is pulled on demand, and
// printf prints the result of a comparison as 1 or 0.
//
// Upstream reads all of stdin once, when <stdio.h> or <iostream> is loaded, so
// a program can never ask for more input while it runs. The patched build
// starts with an empty buffer and calls `config.stdio.drain()` each time a
// read finds the buffer exhausted. A host that blocks inside `drain()` until
// the user types a line therefore gets a normal interactive terminal.
//
// Each replacement must match an exact number of times; if upstream changes,
// this script fails instead of producing a half-patched file.
//
// Usage: node scripts/patch-jscpp.mjs

import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "vendor-src/JSCPP.es5.min.orig.js";
const TARGET = "public/vendor/JSCPP.es5.min.js";

/** [description, expected matches, search, replacement] */
const PATCHES = [
  [
    "cstdio: start empty; add refill (skipped while sscanf borrows the buffer) and want (refill until the buffer can satisfy a read)",
    1,
    `M=N.drain(),j=function(){var a;if(a="",M.length>0)`,
    `M="",N.__refill=function(){if(N.__sscanf)return!1;var a=N.drain();return!!a&&(M+=a,!0)},N.__want=function(a){for(;!a.test(M)&&N.__refill(););},j=function(){var a;if(M.length>0||N.__refill(),a="",M.length>0)`,
  ],
  [
    "cstdio gets(): refill when the buffer is empty",
    1,
    `k=function(){var a,b;return a=M.indexOf("\\n"),`,
    `k=function(){var a,b;return M.length>0||N.__refill(),a=M.indexOf("\\n"),`,
  ],
  [
    "cstdio scanf token reader: refill until there is something the format can match (%c skips newlines, as upstream does)",
    1,
    `q=function(a,b,c,d){var e,f,g,h,i,j;return i=void 0,j=M,`,
    `q=function(a,b,c,d){var e,f,g,h,i,j;return i=void 0,N.__want("."===c?/[^\\n\\r]/:"[^\\n\\r]*"===c?/[^]/:/\\S/),j=M,`,
  ],
  [
    "cstdio sscanf: mark the buffer as borrowed",
    1,
    `k=M,M=l,j=f(c),`,
    `k=M,M=l,N.__sscanf=1,j=f(c),`,
  ],
  [
    "cstdio sscanf: release the buffer",
    1,
    `return M=k,n.val(n.intTypeLiteral,j.length)}`,
    `return M=k,N.__sscanf=0,n.val(n.intTypeLiteral,j.length)}`,
  ],
  ["iostream: start empty", 1, `buf:l.drain(),istream:l,`, `buf:"",istream:l,`],
  [
    "iostream >> (numbers, chars, strings): refill when nothing but whitespace is left",
    2,
    `f=b.v.buf,b.v.eofbit=0===f.length,`,
    `f=b.v.buf,/\\S/.test(f)||(f=b.v.buf=f+(b.v.istream.drain()||"")),b.v.eofbit=0===f.length,`,
  ],
  [
    "iostream getline: refill when the buffer is empty",
    1,
    `g=b.v.buf,b.v.eofbit=0===g.length,`,
    `g=b.v.buf,g.length>0||(g=b.v.buf=b.v.istream.drain()||""),b.v.eofbit=0===g.length,`,
  ],
  [
    "iostream get(): refill when the buffer is empty",
    1,
    `c=b.v.buf,b.v.eofbit=0===c.length,`,
    `c=b.v.buf,c.length>0||(c=b.v.buf=b.v.istream.drain()||""),b.v.eofbit=0===c.length,`,
  ],
  // Comparisons and && || ! produce JavaScript booleans inside the
  // interpreter. In C they are the int values 1 and 0, so printf("%d", a < b)
  // must print 1, not stop with "format argument 'true' not an integer".
  [
    "cast to int, char, float...: a comparison result becomes 1 or 0, so `int t = a < b; if (t == 1)` works",
    1,
    `if("bool"===a.name)return this.val(a,b.v?1:0);`,
    `if("bool"===a.name)return this.val(a,b.v?1:0);"boolean"==typeof b.v&&(b=this.val(b.t,b.v?1:0));`,
  ],
  [
    "printf %d %i %u %x %o: print a comparison result as 1 or 0",
    1,
    `f.prototype.formatInt=function(a){var b=parseInt(a.arg);`,
    `f.prototype.formatInt=function(a){"boolean"==typeof a.arg&&(a.arg=+a.arg);var b=parseInt(a.arg);`,
  ],
  [
    "printf %f %e %g: print a comparison result as 1 or 0",
    1,
    `f.prototype.formatDouble=function(a){var b=parseFloat(a.arg);`,
    `f.prototype.formatDouble=function(a){"boolean"==typeof a.arg&&(a.arg=+a.arg);var b=parseFloat(a.arg);`,
  ],
];

let text = readFileSync(SOURCE, "utf8");
for (const [description, expected, search, replacement] of PATCHES) {
  const found = text.split(search).length - 1;
  if (found !== expected) {
    console.error(`Patch failed: "${description}" matched ${found} time(s), expected ${expected}.`);
    process.exit(1);
  }
  text = text.split(search).join(replacement);
}

const banner =
  "/* JSCPP (MIT, github.com/felixhao28/JSCPP), patched by scripts/patch-jscpp.mjs: stdin is pulled on demand; printf prints comparisons as 1 or 0. */\n";
writeFileSync(TARGET, banner + text);
console.log(`Wrote ${TARGET} (${PATCHES.length} patches applied).`);
