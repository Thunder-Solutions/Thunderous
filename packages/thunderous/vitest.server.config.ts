import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Server-side tests run in Node.js environment (no browser)
		include: ['src/__test__/server/**/*.test.ts'],
		coverage: {
			provider: 'istanbul',
			reporter: ['json'],
			reportsDirectory: './coverage/server',
			exclude: ['src/__test__/**', 'src/**/*.d.ts', 'src/**/index.ts', '**/*.config.*'],
		},
	},
});
