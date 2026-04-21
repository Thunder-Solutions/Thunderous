import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Default to repo's `.browsers`, but let an external PLAYWRIGHT_BROWSERS_PATH win
// (e.g., CI running inside the Playwright Docker image)
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(import.meta.dirname, '../../.browsers');

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
			headless: true,
		},
		include: ['src/__test__/client/**/*.test.ts'],
		coverage: {
			provider: 'istanbul',
			reporter: ['json'],
			reportsDirectory: './coverage/client',
			exclude: ['src/__test__/**', 'src/**/*.d.ts', 'src/**/index.ts', '**/*.config.*'],
		},
	},
});
