#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const DEFAULT_NAME = 'Thunderous Project';
const PLACEHOLDER = '<app-name>';

async function main() {
	const args = process.argv.slice(2);
	const { flags, positional } = parseArgs(args);

	const cwd = process.cwd();
	const currentDirName = path.basename(cwd);

	const rawNameArg = positional[0];
	const dotMeansCurrentDir = rawNameArg === '.';

	let projectName = dotMeansCurrentDir ? currentDirName : rawNameArg;

	if (!projectName) {
		projectName = await prompt(`Project name (${DEFAULT_NAME}): `);
		projectName = projectName.trim() || DEFAULT_NAME;
	}

	const namesMatch = looselyMatches(projectName, currentDirName);

	let targetDir = cwd;
	let createdFolder = false;

	if (flags.currentDir || dotMeansCurrentDir) {
		targetDir = cwd;
	} else if (!namesMatch) {
		const shouldCreateFolder = await confirm(
			`Current folder "${currentDirName}" does not match "${projectName}". Create a new folder? [Y/n]: `,
			true,
		);

		if (shouldCreateFolder) {
			const folderName = toKebabCase(projectName);
			targetDir = path.join(cwd, folderName);
			createdFolder = true;
		}
	}

	ensureTargetIsUsable(targetDir, createdFolder);

	const templateDir = path.resolve(getScriptDir(), '../reference-project');

	if (!fs.existsSync(templateDir)) {
		fail(`Could not find reference-project at: ${templateDir}`);
	}

	copyDirectoryContents(templateDir, targetDir);
	replacePlaceholderInDirectory(targetDir, PLACEHOLDER, projectName);

	if (targetDir !== cwd) {
		console.log(`cd ${path.relative(cwd, targetDir) || '.'}`);
	}
	console.log('Installing dependencies...');
	spawnSync('pnpm', ['install'], { stdio: 'inherit' });
	console.log('\n\nDone! Please run `pnpm dev` to start the development server.');

	console.log(`\n\x1b[32mThunderous project created: ${projectName}\x1b[0m`);
}

function parseArgs(args) {
	const flags = {
		currentDir: false,
	};

	const positional = [];

	for (const arg of args) {
		if (arg === '--current-dir') {
			flags.currentDir = true;
			continue;
		}

		if (arg.startsWith('-')) {
			fail(`Unknown flag: ${arg}`);
		}

		positional.push(arg);
	}

	return { flags, positional };
}

function normalizeForComparison(value) {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/[^\p{L}\p{N}]+/gu, ' ');
	toLowerCase().trim().replace(/\s+/g, ' ');
}

function looselyMatches(a, b) {
	return normalizeForComparison(a) === normalizeForComparison(b);
}

function toKebabCase(value) {
	return normalizeForComparison(value).replace(/\s+/g, '-');
}

function ensureTargetIsUsable(targetDir, createdFolder) {
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
		return;
	}

	const entries = fs.readdirSync(targetDir);
	if (entries.length > 0 && createdFolder) {
		fail(`Target directory already exists and is not empty: ${targetDir}`);
	}
}

function copyDirectoryContents(sourceDir, targetDir) {
	fs.mkdirSync(targetDir, { recursive: true });

	for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
		const sourcePath = path.join(sourceDir, entry.name);
		const targetPath = path.join(targetDir, entry.name);

		if (entry.isDirectory()) {
			fs.cpSync(sourcePath, targetPath, { recursive: true });
		} else {
			fs.copyFileSync(sourcePath, targetPath);
		}
	}
}

function replacePlaceholderInDirectory(dir, searchValue, replacementValue) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			replacePlaceholderInDirectory(fullPath, searchValue, replacementValue);
			continue;
		}

		if (!entry.isFile()) continue;
		if (looksBinary(fullPath)) continue;

		const original = fs.readFileSync(fullPath, 'utf8');
		const updated = original.split(searchValue).join(replacementValue);

		if (updated !== original) {
			fs.writeFileSync(fullPath, updated, 'utf8');
		}
	}
}

function looksBinary(filePath) {
	const buffer = fs.readFileSync(filePath);
	const sampleSize = Math.min(buffer.length, 8000);

	for (let i = 0; i < sampleSize; i++) {
		if (buffer[i] === 0) return true;
	}

	return false;
}

function getScriptDir() {
	return path.dirname(fileURLToPath(import.meta.url));
}

function fail(message) {
	console.error(message);
	process.exit(1);
}

function prompt(query) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(query, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function confirm(query, defaultYes = true) {
	const answer = (await prompt(query)).trim().toLowerCase();

	if (!answer) return defaultYes;
	if (['y', 'yes'].includes(answer)) return true;
	if (['n', 'no'].includes(answer)) return false;

	return defaultYes;
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
