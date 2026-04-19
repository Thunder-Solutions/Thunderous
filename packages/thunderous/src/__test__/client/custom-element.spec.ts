import { test } from '@playwright/test';
import { attributeSignalsTests } from './custom-element/attribute-signals-tests';
import { elementResultTests } from './custom-element/element-result-tests';
import { lifecycleTests } from './custom-element/lifecycle-tests';
import { propertySignalsTests } from './custom-element/property-signals-tests';
import { attributesAsPropertiesTests } from './custom-element/attributes-as-properties-tests';
import { refsTests } from './custom-element/refs-tests';
import { shadowDomTests } from './custom-element/shadow-dom-tests';
import { elementInternalsTests } from './custom-element/element-internals-tests';
import { stylesheetTests } from './custom-element/stylesheet-tests';
import { getterHelperTests } from './custom-element/getter-helper-tests';

/**
 * Tests for custom-element functionality.
 *
 * Test modules are organized in the custom-element/ folder and imported here.
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

	test.describe('ElementResult methods', elementResultTests);

	test.describe('Lifecycle callbacks', lifecycleTests);

	test.describe('Property signals', propertySignalsTests);

	test.describe('Attributes as properties', attributesAsPropertiesTests);

	test.describe('Refs', refsTests);

	test.describe('Shadow DOM options', shadowDomTests);

	test.describe('Element internals and root', elementInternalsTests);

	test.describe('Adopting stylesheets', stylesheetTests);

	test.describe('Getter helper', getterHelperTests);
});
