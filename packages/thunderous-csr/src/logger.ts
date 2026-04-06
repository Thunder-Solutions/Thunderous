// proxy the real console to disable when the global is set.
globalThis.__GLOBAL_THUNDEROUS_LOGGER_DISABLED = false;
export const logger = new Proxy(console, {
	get: (target, key) => {
		const value = target[key as keyof Console];
		if (typeof value === 'function') {
			if (globalThis.__GLOBAL_THUNDEROUS_LOGGER_DISABLED) {
				return () => {};
			} else {
				return value;
			}
		}
		return value;
	},
});
