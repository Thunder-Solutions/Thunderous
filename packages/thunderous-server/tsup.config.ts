import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	external: [
		'thunderous',
		'express',
		'typescript',
		'es-module-lexer',
		'resolve',
		'resolve.exports',
		'connect-livereload',
		'livereload',
		'tsx',
	],
});
