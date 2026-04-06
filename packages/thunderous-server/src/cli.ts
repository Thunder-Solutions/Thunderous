import { build } from './build';
import nodemon from 'nodemon';
import { existsSync, readFileSync } from 'fs';
import { config } from './config';
import { relative, resolve } from 'path';
import chalk from 'chalk';

const args = process.argv.slice(2);

if (args[0] === 'dev') {
	try {
		const ignores = existsSync('.gitignore')
			? readFileSync('.gitignore', 'utf-8')
					.split('\n')
					.filter((line) => line.trim() !== '' && !line.startsWith('#'))
			: [];

		// Set up nodemon for auto-restart on server changes
		if (process.env.NODE_ENV !== 'production') {
			nodemon({
				script: resolve(`${import.meta.dirname}/dev.ts`),
				ignore: ignores,
				watch: [config.baseDir],
				exec: 'tsx',
			});

			nodemon
				.on('start', () => {
					// console.log('App has started');
				})
				.on('quit', () => {
					console.log(chalk.green('\nServer shut down successfully.\n'));
					process.exit();
				})
				.on('restart', (files) => {
					const filesList = (files ?? ['(none)']).map(
						(file) => `  • ${chalk.cyan.underline(relative(config.configDir ?? process.cwd(), file))}\n`,
					);
					console.log('\nUpdates detected:\n', filesList.join(''));
				});
		}
	} catch (error) {
		console.error('\x1b[31mFailed to start server:\x1b[0m', error);
		process.exit(1);
	}
} else if (args[0] === 'build') {
	try {
		build();
	} catch (error) {
		console.error('\x1b[31mBuild failed:\x1b[0m', error);
		process.exit(1);
	}
} else {
	console.log('Usage:');
	console.log('  --dev    Start the development server');
	console.log('  --build  Build the static site');
}
