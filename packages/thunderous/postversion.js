import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { bumpVersion } from '../../scripts/bump-version.js';

const type = process.argv[2];

// Bump this package's own version
const thunderousPkgPath = join(import.meta.dirname, 'package.json');
const thunderousPkg = JSON.parse(readFileSync(thunderousPkgPath, 'utf8'));
const newVersion = bumpVersion(thunderousPkg.version, type);
thunderousPkg.version = newVersion;
writeFileSync(thunderousPkgPath, JSON.stringify(thunderousPkg, null, '\t') + '\n');

// Packages that list thunderous as a peer dependency — always patch-bump these
// and update their peer dep to the new thunderous version.
const peerDependentPackages = ['thunderous-csr', 'thunderous-server'];
const updatedVersions = {};

for (const pkgName of peerDependentPackages) {
	const pkgPath = join(import.meta.dirname, '..', pkgName, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

	const newPkgVersion = bumpVersion(pkg.version, 'patch');
	pkg.version = newPkgVersion;
	updatedVersions[pkgName] = newPkgVersion;

	if (pkg.peerDependencies?.thunderous) {
		const prefix = pkg.peerDependencies.thunderous.match(/^[^0-9]*/)?.[0] ?? '';
		pkg.peerDependencies.thunderous = `${prefix}${newVersion}`;
	}

	writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
}

// Update reference-project in create-thunderous
const refProjectPath = join(import.meta.dirname, '..', 'create-thunderous', 'reference-project', 'package.json');
const refProject = JSON.parse(readFileSync(refProjectPath, 'utf8'));

if (refProject.dependencies?.thunderous) {
	const prefix = refProject.dependencies.thunderous.match(/^[^0-9]*/)?.[0] ?? '';
	refProject.dependencies.thunderous = `${prefix}${newVersion}`;
}

if (refProject.dependencies?.['thunderous-csr'] && updatedVersions['thunderous-csr']) {
	const prefix = refProject.dependencies['thunderous-csr'].match(/^[^0-9]*/)?.[0] ?? '';
	refProject.dependencies['thunderous-csr'] = `${prefix}${updatedVersions['thunderous-csr']}`;
}

if (refProject.devDependencies?.['thunderous-server'] && updatedVersions['thunderous-server']) {
	const prefix = refProject.devDependencies['thunderous-server'].match(/^[^0-9]*/)?.[0] ?? '';
	refProject.devDependencies['thunderous-server'] = `${prefix}${updatedVersions['thunderous-server']}`;
}

writeFileSync(refProjectPath, JSON.stringify(refProject, null, '\t') + '\n');

// Patch-bump create-thunderous itself
const createPkgPath = join(import.meta.dirname, '..', 'create-thunderous', 'package.json');
const createPkg = JSON.parse(readFileSync(createPkgPath, 'utf8'));
createPkg.version = bumpVersion(createPkg.version, 'patch');
writeFileSync(createPkgPath, JSON.stringify(createPkg, null, '\t') + '\n');

// Follow-on bumps for the non-published workspaces that track thunderous's version.
// These invoke `pnpm version <type>` (pnpm's real command, not a script), which
// bumps their package.json. `.npmrc` has `git-tag-version=false`, so no tags.
spawnSync('pnpm', ['version', type], { cwd: `${import.meta.dirname}/../../www` });
spawnSync('pnpm', ['version', type], { cwd: `${import.meta.dirname}/demo` });

// Stage everything so the user can review and commit.
spawnSync('git', ['add', '-A']);
