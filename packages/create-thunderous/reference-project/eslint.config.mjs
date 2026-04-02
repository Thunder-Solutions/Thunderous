import js from '@eslint/js';
import ts from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	js.configs.recommended,
	...ts.configs.recommended,
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},
	{
		ignores: ['package-lock.json', 'node_modules/', 'dist/', '**/*.tmp.*'],
	},
]);
