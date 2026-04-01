import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './src/__test__/client',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list', // See https://playwright.dev/docs/test-reporters
	use: {
		baseURL: 'http://localhost:5555',
		trace: 'on-first-retry', // See https://playwright.dev/docs/trace-viewer
		headless: true,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],
	webServer: {
		command: 'npm run demo',
		url: 'http://localhost:5555',
		reuseExistingServer: !process.env.CI,
	},
});
