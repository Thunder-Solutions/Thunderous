#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const packages = [
	{ name: 'thunderous', path: 'packages/thunderous', dependsOn: [] },
	{ name: 'thunderous-csr', path: 'packages/thunderous-csr', dependsOn: ['thunderous'] },
	{ name: 'thunderous-server', path: 'packages/thunderous-server', dependsOn: ['thunderous'] },
	{ name: 'create-thunderous', path: 'packages/create-thunderous', dependsOn: ['thunderous-csr', 'thunderous-server'] },
];

const isDryRun = process.argv.includes('--dry-run');
const skipConfirm = process.argv.includes('--yes');

function exec(command, args, options = {}) {
	if (isDryRun) {
		console.log(`[DRY RUN] Would execute: ${command} ${args.join(' ')}`);
		return { status: 0, stdout: '', stderr: '' };
	}
	return spawnSync(command, args, { stdio: 'inherit', ...options });
}

function execQuiet(command, args, options = {}) {
	if (isDryRun) {
		console.log(`[DRY RUN] Would execute: ${command} ${args.join(' ')}`);
		return { status: 0, stdout: '', stderr: '' };
	}
	return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function getGitStatus() {
	const result = execQuiet('git', ['status', '--porcelain']);
	if (result.status !== 0) {
		console.error('Failed to check git status');
		process.exit(1);
	}
	return result.stdout.trim();
}

function getCurrentBranch() {
	// Always run git command (read-only, safe to run even in dry-run)
	const result = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
	if (result.status !== 0) {
		console.error('Failed to get current branch');
		process.exit(1);
	}
	return result.stdout.trim();
}

function checkNpmVersionExists(pkgName, version) {
	const result = execQuiet('pnpm', ['view', `${pkgName}@${version}`, 'version'], { stdio: 'pipe' });
	return result.status === 0 && result.stdout.trim() === version;
}

function getPackageVersion(pkgPath) {
	const pkgJson = JSON.parse(readFileSync(join(pkgPath, 'package.json'), 'utf8'));
	return pkgJson.version;
}

async function main() {
	console.log('🔍 Checking pre-publish conditions...\n');

	// Check 1: Clean working tree
	const status = getGitStatus();
	if (status) {
		console.error('❌ Error: Working tree is not clean.');
		console.error('Uncommitted changes:\n' + status);
		process.exit(1);
	}
	console.log('✅ Working tree is clean');

	// Check 2: On next branch
	const branch = getCurrentBranch();
	if (branch !== 'next') {
		console.error(`❌ Error: Must be on next branch (currently on "${branch}")`);
		process.exit(1);
	}
	console.log(`✅ On ${branch} branch`);

	// Check 3: Check if versions already exist on npm
	console.log('\n📦 Checking npm registry for existing versions...');
	const publishPlan = [];

	for (const pkg of packages) {
		const fullPath = join(process.cwd(), pkg.path);
		const version = getPackageVersion(fullPath);
		const exists = checkNpmVersionExists(pkg.name, version);

		if (exists) {
			console.log(`  ⏭️  ${pkg.name}@${version} already published`);
		} else {
			console.log(`  📝 ${pkg.name}@${version} will be published`);
			publishPlan.push({ ...pkg, version, path: fullPath });
		}
	}

	if (publishPlan.length === 0) {
		console.log('\n✨ All packages are already up to date on npm. Nothing to publish.');
		process.exit(0);
	}

	console.log(`\n📋 Publish plan (${publishPlan.length} packages):`);
	for (const pkg of publishPlan) {
		console.log(`   - ${pkg.name}@${pkg.version}`);
	}

	// Check 4: User confirmation
	if (!skipConfirm) {
		const answer = await question('\n⚠️  Continue with publish? (yes/no): ');
		if (answer.toLowerCase() !== 'yes') {
			console.log('Aborted.');
			process.exit(0);
		}
	}

	// Run prepublishOnly on all packages first (quality checks + build)
	console.log('\n🚀 Running prepublishOnly checks on all packages...\n');

	for (const pkg of publishPlan) {
		const pkgJson = JSON.parse(readFileSync(join(pkg.path, 'package.json'), 'utf8'));
		if (pkgJson.scripts?.prepublishOnly) {
			console.log(`Running prepublishOnly for ${pkg.name}...`);
			const prepublishResult = exec('pnpm', ['run', 'prepublishOnly'], { cwd: pkg.path });
			if (prepublishResult.status !== 0) {
				console.error(`❌ prepublishOnly failed for ${pkg.name}`);
				process.exit(1);
			}
			console.log(`✅ prepublishOnly passed for ${pkg.name}\n`);
		}
	}

	// Publish in dependency order
	console.log('\n🚀 Publishing packages...\n');

	for (const pkg of publishPlan) {
		console.log(`Publishing ${pkg.name}@${pkg.version}...`);

		// Publish
		const publishResult = exec('pnpm', ['publish', '--access', 'public'], { cwd: pkg.path });
		if (publishResult.status !== 0) {
			console.error(`❌ Publish failed for ${pkg.name}`);
			process.exit(1);
		}

		console.log(`✅ Published ${pkg.name}@${pkg.version}\n`);
	}

	console.log('🎉 All packages published successfully!');
	rl.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
