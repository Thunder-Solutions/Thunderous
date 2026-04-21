import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { bumpVersion } from '../../scripts/bump-version.js';

const type = process.argv[2];

// Bump this package's own version
const ownPkgPath = join(import.meta.dirname, 'package.json');
const ownPkg = JSON.parse(readFileSync(ownPkgPath, 'utf8'));
ownPkg.version = bumpVersion(ownPkg.version, type);
writeFileSync(ownPkgPath, JSON.stringify(ownPkg, null, '\t') + '\n');

// Stage everything so the user can review and commit.
spawnSync('git', ['add', '-A']);
