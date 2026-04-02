#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { input, confirm, select } from '@inquirer/prompts';
import stringWidth from 'string-width';
import chalk from 'chalk';
import { emojify } from 'node-emoji';
import { shimConsoleLog } from 'emoji-space-shim';

const shim = shimConsoleLog();
process.on('exit', () => {
	shim.restore();
});

const DEFAULT_NAME = 'Thunderous Project';
const DEFAULT_PACKAGE_MANAGER = 'pnpm';
const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'];
const PLACEHOLDER = '<app-name>';

const program = new Command();

program
	.name('create-thunderous')
	.description('Scaffold a new Thunderous project')
	.version('0.0.0')
	.argument('[project-name]', 'project name, or "." to scaffold in the current directory')
	.option('--current-dir', 'scaffold in the current directory')
	.option('-p, --package-manager <name>', `package manager to use (${PACKAGE_MANAGERS.join(', ')})`)
	.showHelpAfterError('(add --help for additional information)')
	.configureOutput({
		outputError: (str, write) => write(`\x1b[31m${str}\x1b[0m`),
	});

program.parse();

const options = program.opts();
const rawNameArg = program.args[0];

await main({
	rawNameArg,
	currentDir: Boolean(options.currentDir),
	packageManager: options.packageManager,
});

async function main({ rawNameArg, currentDir, packageManager }) {
	const cwd = process.cwd();
	const currentDirName = path.basename(cwd);
	const dotMeansCurrentDir = rawNameArg === '.';

	let projectName = dotMeansCurrentDir ? currentDirName : rawNameArg;

	if (!projectName) {
		projectName = await input({
			message: 'Project name',
			default: DEFAULT_NAME,
		});
	}

	projectName = projectName.trim() || DEFAULT_NAME;

	const namesMatch = looselyMatches(projectName, currentDirName);

	let targetDir = cwd;
	let createdFolder = false;

	if (currentDir || dotMeansCurrentDir) {
		targetDir = cwd;
	} else if (!namesMatch) {
		targetDir = path.join(cwd, toKebabCase(projectName));
		createdFolder = true;
	}

	ensureTargetIsUsable(targetDir, createdFolder);

	const chosenPackageManager = await choosePackageManager(packageManager);

	const templateDir = path.resolve(getScriptDir(), '../reference-project');
	if (!fs.existsSync(templateDir)) {
		fail(`Could not find reference-project at: ${templateDir}`);
	}

	logStep('Scaffolding project files');
	copyDirectoryContents(templateDir, targetDir);
	replacePlaceholderInDirectory(targetDir, PLACEHOLDER, projectName);

	logStep(`Preparing ${chosenPackageManager}`);
	ensurePackageManagerInstalled(chosenPackageManager);

	logStep(`Installing dependencies with ${chosenPackageManager}`);
	runInstall(chosenPackageManager, targetDir);

	const shouldInitializeGit = await confirm({
		message: 'Initialize git repository?',
		default: true,
	});

	if (shouldInitializeGit) {
		logStep('Initializing git repository');
		runCommand('git', ['init'], { cwd: targetDir });
	}

	printSuccess(projectName, targetDir, cwd, chosenPackageManager);
}

async function choosePackageManager(explicitValue) {
	if (explicitValue) {
		const normalized = explicitValue.toLowerCase();
		if (!PACKAGE_MANAGERS.includes(normalized)) {
			fail(`Unsupported package manager "${explicitValue}". Use one of: ${PACKAGE_MANAGERS.join(', ')}`);
		}
		return normalized;
	}

	return await select({
		message: 'Which package manager would you like to use?',
		default: DEFAULT_PACKAGE_MANAGER,
		choices: [
			{ name: 'pnpm', value: 'pnpm' },
			{ name: 'npm', value: 'npm' },
			{ name: 'yarn', value: 'yarn' },
		],
	});
}

function normalizeForComparison(value) {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ');
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

function ensurePackageManagerInstalled(packageManager) {
	if (hasCommand(packageManager)) return;

	if (packageManager === 'npm') {
		fail('npm is not available on this system. Install Node.js first, since npm is bundled with Node.');
	}

	if (!hasCommand('corepack')) {
		if (!hasCommand('npm')) {
			fail(
				`${packageManager} is not installed, and Corepack is unavailable. Install Node.js/npm or install ${packageManager} manually.`,
			);
		}

		logSubstep('Installing Corepack');
		runCommand('npm', ['install', '-g', 'corepack@latest']);
	}

	logSubstep(`Enabling Corepack shim for ${packageManager}`);
	runCommand('corepack', ['enable', packageManager]);

	logSubstep(`Installing ${packageManager} via Corepack`);
	runCommand('corepack', ['install', '-g', `${packageManager}@latest`]);

	if (!hasCommand(packageManager)) {
		fail(`Failed to make ${packageManager} available on PATH.`);
	}
}

function runInstall(packageManager, cwd) {
	if (packageManager === 'npm') {
		runCommand('npm', ['install'], { cwd });
		return;
	}

	if (packageManager === 'pnpm') {
		runCommand('pnpm', ['install'], { cwd });
		return;
	}

	if (packageManager === 'yarn') {
		runCommand('yarn', ['install'], { cwd });
		return;
	}

	fail(`Unsupported package manager: ${packageManager}`);
}

function hasCommand(command) {
	const result = spawnSync(command, ['--version'], {
		stdio: 'ignore',
		shell: process.platform === 'win32',
	});

	return result.status === 0;
}

function runCommand(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		cwd: options.cwd,
		shell: process.platform === 'win32',
	});

	if (result.error) {
		fail(`Failed to run "${command} ${args.join(' ')}": ${result.error.message}`);
	}

	if (result.status !== 0) {
		fail(`Command failed: ${command} ${args.join(' ')}`);
	}
}

function getScriptDir() {
	return path.dirname(fileURLToPath(import.meta.url));
}

function stripAnsi(value) {
	return value.replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleWidth(value) {
	return stringWidth(stripAnsi(value));
}

function printSuccess(projectName, targetDir, originalCwd, packageManager) {
	const lines = [
		`${chalk.blue(emojify(':cloud_with_lightning:'))}  ${chalk.magenta('Thunderous project created successfully!')} ${chalk.blue(emojify(':cloud_with_lightning:'))}`,
		'',
		`    ${chalk.bold('Name:')} ${chalk.blue(projectName)}`,
		`    ${chalk.bold('Package manager:')} ${chalk.blue(packageManager)}`,
		`    ${chalk.bold('Location:')} ${chalk.underline(chalk.blue(targetDir))}`,
		'',
		`    ${chalk.bold(targetDir !== originalCwd ? 'Next steps:' : 'Next step:')}`,
		...(targetDir !== originalCwd ? [chalk.blue(`      cd ${path.relative(originalCwd, targetDir) || '.'}`)] : []),
		chalk.blue(`      ${packageManager} dev`),
	];

	printBox(lines, {
		borderColor: 'magenta',
		textColor: 'white',
		padding: 2,
		marginBottom: 1,
	});
}

function printBox(lines, options = {}) {
	const { borderColor = '', textColor = '', padding = 0, marginTop = 1, marginBottom = 0 } = options;

	const contentWidth = Math.max(...lines.map((line) => visibleWidth(line)), 0);
	const innerWidth = contentWidth + padding * 2;
	const horizontalWidth = innerWidth + 2;
	const bc = chalk[borderColor];
	const tc = chalk[textColor];

	const top = bc(`╭${'─'.repeat(horizontalWidth)}──╮`);
	const bottom = bc(`╰${'─'.repeat(horizontalWidth)}──╯`);
	const emptyLine = `${bc('│')} ${' '.repeat(innerWidth)}   ${bc('│')}`;

	if (marginTop > 0) {
		process.stdout.write('\n'.repeat(marginTop));
	}

	console.log(top);
	console.log(emptyLine);

	for (const line of lines) {
		const width = visibleWidth(line);
		const rightPad = innerWidth - width - padding;
		const paddedLine = ' '.repeat(padding) + line + ' '.repeat(Math.max(0, rightPad));

		console.log(`${bc('│')} ${tc(paddedLine)}   ${bc('│')}`);
	}

	console.log(emptyLine);
	console.log(bottom);

	if (marginBottom > 0) {
		process.stdout.write('\n'.repeat(marginBottom));
	}
}

function logStep(message) {
	console.log('');
	console.log(`\x1b[36m▶\x1b[0m ${message}`);
}

function logSubstep(message) {
	console.log(`  \x1b[90m•\x1b[0m ${message}`);
}

function fail(message) {
	console.error('');
	console.error(`\x1b[31m✖ ${message}\x1b[0m`);
	process.exit(1);
}
