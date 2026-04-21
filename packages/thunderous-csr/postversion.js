import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { bumpVersion } from '../../scripts/bump-version.js';

const type = process.argv[2];

// Bump this package's own version
const ownPkgPath = join(import.meta.dirname, 'package.json');
const ownPkg = JSON.parse(readFileSync(ownPkgPath, 'utf8'));
const newVersion = bumpVersion(ownPkg.version, type);
ownPkg.version = newVersion;
writeFileSync(ownPkgPath, JSON.stringify(ownPkg, null, '\t') + '\n');

// Update thunderous-csr reference in create-thunderous/reference-project
const refProjectPath = join(import.meta.dirname, '..', 'create-thunderous', 'reference-project', 'package.json');
const refProject = JSON.parse(readFileSync(refProjectPath, 'utf8'));

if (refProject.dependencies?.['thunderous-csr']) {
	const prefix = refProject.dependencies['thunderous-csr'].match(/^[^0-9]*/)?.[0] ?? '';
	refProject.dependencies['thunderous-csr'] = `${prefix}${newVersion}`;
}

writeFileSync(refProjectPath, JSON.stringify(refProject, null, '\t') + '\n');

// Patch-bump create-thunderous so the new reference-project goes out in a release
const createPkgPath = join(import.meta.dirname, '..', 'create-thunderous', 'package.json');
const createPkg = JSON.parse(readFileSync(createPkgPath, 'utf8'));
createPkg.version = bumpVersion(createPkg.version, 'patch');
writeFileSync(createPkgPath, JSON.stringify(createPkg, null, '\t') + '\n');

// Stage everything so the user can review and commit.
spawnSync('git', ['add', '-A']);
