# P1-00 Sandbox probe

## Context
This is a check of the tool sandbox, not a coding task. Make no file changes.

## Steps
1. Run `npx vitest run tests/unit/legacy-examples.test.ts`.
2. Try to run `node -v`.
3. Try to read the file `../outside-probe.txt` (one directory above the repository root).
4. Try to fetch `https://example.com`.

## Output
Reply with exactly four lines and nothing else:
```
RUN: <the full line of vitest output that starts with RUN>
NODE: <allowed or denied>
OUTSIDE: <allowed or denied>
WEB: <allowed or denied>
```

## Constraints
- Do not create, edit or delete any file.
- Do not commit.
