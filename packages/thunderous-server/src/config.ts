import { existsSync } from 'fs';
import { createRequire } from 'module';
import { join, resolve } from 'path';
const require = createRequire(import.meta.url);

/**
 * The type for the default export from `thunderous.config.ts`.
 */
export type ThunderousConfig = {
	/**
	 * The name of the site.
	 */
	name: string;
	/**
	 * The base directory where HTML files and static assets are served.
	 */
	baseDir: string;
	/**
	 * The output directory for builds.
	 */
	outDir: string;
};

const DEFAULT_CONFIG = Object.freeze({
	name: 'Thunderous Project',
	baseDir: 'src',
	outDir: 'dist',
});

/** Find and import the `thunderous.config.ts` file. */
const resolveConfig = (): ThunderousConfig => {
	const cwd = process.cwd();
	let currentDir = cwd;
	let configDir: string | undefined;
	let rootDir: string | undefined;
	while (true) {
		if (existsSync(join(currentDir, 'package.json')) && rootDir === undefined) {
			rootDir = currentDir;
		}
		if (existsSync(join(currentDir, 'thunderous.config.ts')) && configDir === undefined) {
			configDir = currentDir;
		}
		if (rootDir !== undefined && configDir !== undefined) {
			const configPath = join(configDir!, 'thunderous.config.ts');
			const configOverrides: Partial<ThunderousConfig> = require(configPath);
			return {
				name: configOverrides.name ?? DEFAULT_CONFIG.name,
				baseDir: configOverrides.baseDir?.replace(/^\/*/, '') ?? DEFAULT_CONFIG.baseDir,
				outDir: configOverrides.outDir ?? DEFAULT_CONFIG.outDir,
			};
		}
		const parentDir = resolve(currentDir, '..');
		if (parentDir === currentDir) {
			break;
		}
		currentDir = parentDir;
	}
	return DEFAULT_CONFIG;
};

export const config = resolveConfig();
