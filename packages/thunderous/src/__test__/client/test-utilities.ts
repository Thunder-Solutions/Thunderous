import type { Page } from '@playwright/test';

type SetupArgs = typeof window.Thunderous & typeof window.TestUtils;
type SetupFn = ((args: SetupArgs) => Promise<void>) | ((args: SetupArgs) => void);

export const setup = (page: Page, fn: SetupFn) =>
	page.evaluate((fnString) => {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		const fn = new Function('return (' + fnString + ')')();
		return fn({ ...window.Thunderous, ...window.TestUtils });
	}, fn.toString());
