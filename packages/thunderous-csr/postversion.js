import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const newVersion = process.env.npm_new_version;

// Update reference-project in create-thunderous
const refProjectPath = join(import.meta.dirname, '..', 'create-thunderous', 'reference-project', 'package.json');
const refProject = JSON.parse(readFileSync(refProjectPath, 'utf8'));

// Update thunderous-csr dependency
if (refProject.dependencies?.['thunderous-csr']) {
	const prefix = refProject.dependencies['thunderous-csr'].match(/^[^0-9]*/)?.[0] ?? '';
	refProject.dependencies['thunderous-csr'] = `${prefix}${newVersion}`;
}

writeFileSync(refProjectPath, JSON.stringify(refProject, null, '\t') + '\n');

// Bump patch version of create-thunderous
const createPkgPath = join(import.meta.dirname, '..', 'create-thunderous', 'package.json');
const createPkg = JSON.parse(readFileSync(createPkgPath, 'utf8'));
const [major, minor, patch] = createPkg.version.split('.');
createPkg.version = `${major}.${minor}.${parseInt(patch) + 1}`;
writeFileSync(createPkgPath, JSON.stringify(createPkg, null, '\t') + '\n');

// Stage changes
spawnSync('git', ['add', '-A']);
