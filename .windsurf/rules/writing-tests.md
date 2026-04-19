---
trigger: model_decision
description: When writing tests
---

Use TDD principles and write failing tests before implementing the code.

If you are asked to write tests for code that already exists:

- Avoid writing tests only to satisfy the current implementation; instead, focus on the intended behavior.
- If a failing test genuinely reveals a bug, attempt to fix the code implementation before moving on.
- After you're done, summarize in a readable tabular format (if applicable):
  - Tests that failed during this session
  - The bugs those tests revealed
  - How those bugs were fixed

While troubleshooting failing tests:

- Do not continuously run the entire suite for every little change. Isolate one test at a time to check it individually.
- Not a single error is ever acceptable, regardless if it's pre-existing, unhandled, or seemingly unrelated.
