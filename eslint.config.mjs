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
		'**/**.config.*',
		'**/reference-project/**',
		'**/.browsers',
		'**/.vercel',
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

		// TODO: Review these rules to make sure they're up to our current standards
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
			'@typescript-eslint/no-empty-function': 'off',

			// START-- temporary while we fix issues
			'@typescript-eslint/no-floating-promises': 'off',
			'@typescript-eslint/no-misused-new': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'no-control-regex': 'off',
			// END-- temporary while we fix issues
		},
	},
	{
		files: ['**/*.test.ts', '**/*.spec.ts'],

		languageOptions: {
			globals: {
				...globals.node,
			},
		},

		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
			// START-- temporary while we fix issues
			'@typescript-eslint/no-base-to-string': 'off',
			// END-- temporary while we fix issues
		},
	},
	{
		files: ['**/*.js'],

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
			},
		},

		rules: {
			...js.configs.recommended.rules,
		},
	},

	// START-- temporary while we fix issues
	{
		files: ['**/*.d.ts'],

		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-redundant-type-constituents': 'off',
			'no-var': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
	{
		files: ['packages/thunderous/src/render.ts'],

		rules: {
			'@typescript-eslint/no-base-to-string': 'off',
		},
	},
	{
		files: ['packages/thunderous-server/src/generate.ts'],

		rules: {
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'no-control-regex': 'off',
		},
	},
	{
		files: ['packages/thunderous-server/src/generate.ts', 'packages/thunderous-server/src/*.ts'],

		rules: {
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'no-control-regex': 'off',
		},
	},
	{
		files: ['packages/thunderous-csr/src/global-nav-handlers.ts'],

		rules: {
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		files: ['packages/create-thunderous/bin/index.js'],

		rules: {
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'no-control-regex': 'off',
		},
	},
	// END-- temporary while we fix issues
]);
