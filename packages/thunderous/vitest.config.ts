import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
			headless: true,
		},
		include: ['src/__test__/client/**/*.spec.ts'],
	},
});
