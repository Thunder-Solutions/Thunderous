---
trigger: model_decision
description: When running commands
---

- _Never_ truncate the output. The output of each command is important to both the model and the user, and hiding information often results in repeated runs that take longer.
- If a command is taking too long, interrupt it and try a different approach.
- Wrap each command in a reasonably short timeout to prevent hanging and taking too long.
  - Check for common timeout utilities, and if they are not installed, use a quick manual timeout approach.
