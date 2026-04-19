import { test } from '@playwright/test';
import { attributeSignalsTests } from './custom-element/attribute-signals-tests';

/**
 * Tests for attribute signals when attributes are set before element upgrade/connection.
 *
 * When elements are created programmatically (createElement + setAttribute + append),
 * the attributes are set BEFORE the custom element constructor runs and BEFORE
 * connectedCallback starts the MutationObserver. This tests that attrSignals
 * correctly reflect the actual DOM attribute values in that scenario.
 */

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5555');
	await page.addScriptTag({
		url: 'src/test.ts',
		type: 'module',
	});
});

test.describe('customElement', () => {
	test.describe('Attribute signals', attributeSignalsTests);
});
