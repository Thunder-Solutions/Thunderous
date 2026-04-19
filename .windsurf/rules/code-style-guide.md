---
trigger: always_on
---

For every code change:

- When applicable, use TDD principles and write failing tests before implementing the code.
- Read the relevant eslint, prettier, and tsconfig files. Do not introduce any new errors or warnings.
- Before concluding, run `pnpm quality` to ensure ALL checks and tests still pass.
- Keep the documentation up to date as you work on the project.
