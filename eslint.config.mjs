import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	globalIgnores([
		'**/demo',
		'**/dist',
		'**/vendor',
		'**/www',
		'**/coverage',
		'**/*.ejs',
		'**/**config.js',
		'**/**config.ts',
		'**/.eslintrc.cjs',
	]),
	{
		extends: compat.extends(
			'plugin:@typescript-eslint/recommended-type-checked',
			'plugin:@typescript-eslint/stylistic-type-checked',
		),

		plugins: {
			'@typescript-eslint': typescriptEslint,
		},

		languageOptions: {
			parser: tsParser,
			ecmaVersion: 5,
			sourceType: 'script',

			parserOptions: {
				project: './tsconfig.eslint.json',
			},
		},

		rules: {
			'@typescript-eslint/array-type': 'off',
			'@typescript-eslint/consistent-type-definitions': 'off',

			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports',
				},
			],

			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
				},
			],

			'@typescript-eslint/require-await': 'off',

			'@typescript-eslint/no-misused-promises': [
				'error',
				{
					checksVoidReturn: {
						attributes: false,
					},
				},
			],

			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
		},
	},
	{
		files: ['**/*.test.ts'],

		languageOptions: {
			globals: {
				...globals.node,
			},
		},

		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
		},
	},
]);
