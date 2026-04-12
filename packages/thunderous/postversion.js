import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const [oldMajor, oldMinor] = process.env.npm_old_version.split('.');
const [newMajor, newMinor] = process.env.npm_new_version.split('.');
const type = oldMajor !== newMajor ? 'major' : oldMinor !== newMinor ? 'minor' : 'patch';
const newVersion = process.env.npm_new_version;

// Packages that list thunderous as a peer dependency
const peerDependentPackages = ['thunderous-csr', 'thunderous-server'];
const updatedVersions = {};

for (const pkgName of peerDependentPackages) {
	const pkgPath = join(import.meta.dirname, '..', pkgName, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

	// Bump patch version
	const [major, minor, patch] = pkg.version.split('.');
	const newPkgVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
	pkg.version = newPkgVersion;
	updatedVersions[pkgName] = newPkgVersion;

	// Update peer dependency version
	if (pkg.peerDependencies?.thunderous) {
		// Preserve the prefix (^, >=, etc.) but update the version
		const prefix = pkg.peerDependencies.thunderous.match(/^[^0-9]*/)?.[0] ?? '';
		pkg.peerDependencies.thunderous = `${prefix}${newVersion}`;
	}

	writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
}

// Update reference-project in create-thunderous
const refProjectPath = join(import.meta.dirname, '..', 'create-thunderous', 'reference-project', 'package.json');
const refProject = JSON.parse(readFileSync(refProjectPath, 'utf8'));

// Update thunderous dependency
if (refProject.dependencies?.thunderous) {
	const prefix = refProject.dependencies.thunderous.match(/^[^0-9]*/)?.[0] ?? '';
	refProject.dependencies.thunderous = `${prefix}${newVersion}`;
}

// Update thunderous-csr dependency
if (refProject.dependencies?.['thunderous-csr'] && updatedVersions['thunderous-csr']) {
	const prefix = refProject.dependencies['thunderous-csr'].match(/^[^0-9]*/)?.[0] ?? '';
	refProject.dependencies['thunderous-csr'] = `${prefix}${updatedVersions['thunderous-csr']}`;
}

// Update thunderous-server devDependency
if (refProject.devDependencies?.['thunderous-server'] && updatedVersions['thunderous-server']) {
	const prefix = refProject.devDependencies['thunderous-server'].match(/^[^0-9]*/)?.[0] ?? '';
	refProject.devDependencies['thunderous-server'] = `${prefix}${updatedVersions['thunderous-server']}`;
}

writeFileSync(refProjectPath, JSON.stringify(refProject, null, '\t') + '\n');

// Bump patch version of create-thunderous
const createPkgPath = join(import.meta.dirname, '..', 'create-thunderous', 'package.json');
const createPkg = JSON.parse(readFileSync(createPkgPath, 'utf8'));
const [createMajor, createMinor, createPatch] = createPkg.version.split('.');
createPkg.version = `${createMajor}.${createMinor}.${parseInt(createPatch) + 1}`;
writeFileSync(createPkgPath, JSON.stringify(createPkg, null, '\t') + '\n');

spawnSync('npm', ['version', type], { cwd: `${import.meta.dirname}/../../www` });
spawnSync('npm', ['version', type], { cwd: `${import.meta.dirname}/demo` });
spawnSync('git', ['add', '-A']);
