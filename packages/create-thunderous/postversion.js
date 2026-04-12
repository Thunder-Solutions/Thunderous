import { spawnSync } from 'child_process';

// Stage all changes
spawnSync('git', ['add', '-A']);
