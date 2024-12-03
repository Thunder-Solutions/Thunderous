import { type Mock, type TestContext } from 'node:test';
import { NOOP } from '../utilities';

export const getLogMock = (testContext: TestContext) => {
	testContext.mock.method(console, 'log', NOOP);
	type MockFunctionContext = Mock<typeof console.log>['mock'];
	// @ts-expect-error // typescript doesn't honor the node mock
	return console.log.mock as MockFunctionContext;
};

export const getWarnMock = (testContext: TestContext) => {
	testContext.mock.method(console, 'warn', NOOP);
	type MockFunctionContext = Mock<typeof console.warn>['mock'];
	// @ts-expect-error // typescript doesn't honor the node mock
	return console.warn.mock as MockFunctionContext;
};

export const getErrorMock = (testContext: TestContext) => {
	testContext.mock.method(console, 'error', NOOP);
	type MockFunctionContext = Mock<typeof console.error>['mock'];
	// @ts-expect-error // typescript doesn't honor the node mock
	return console.error.mock as MockFunctionContext;
};

export const nextMicrotask = () => new Promise<void>((resolve) => queueMicrotask(resolve));
