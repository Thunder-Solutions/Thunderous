import type { ThunderousConfig } from './config';

/**
 * A breadcrumb (name and path) for a given page.
 */
export type Breadcrumb = {
	/**
	 * The name of the page.
	 */
	name: string;
	/**
	 * The full URL path to the page.
	 */
	pathname: string;
};

/**
 * Metadata about the current page being rendered.
 */
type Meta = {
	/**
	 * The configuration object from `thunderous.config.ts`.
	 */
	config: ThunderousConfig;
	/**
	 * The pathname of the current page being rendered.
	 */
	pathname: string;
	/**
	 * The breadcrumbs of the current page being rendered.
	 */
	breadcrumbs: Breadcrumb[];
	/**
	 * The inferred title of the current page being rendered.
	 *
	 * This is derived from the filename, replacing hyphens and underscores
	 * with spaces, and capitalizing the first letter of each word.
	 */
	title: string;
	/**
	 * The name of the current page being rendered.
	 *
	 * This is the filename without the extension.
	 */
	name: string;
	/**
	 * The filename of the current page being rendered.
	 *
	 * This is the full filename including the extension.
	 */
	filename: string;
};

const metaState: Meta = {
	config: {
		name: '',
		baseDir: '',
		outDir: '',
		configDir: null,
	},
	pathname: '/',
	breadcrumbs: [],
	title: '',
	name: '',
	filename: '',
};

/** Set metadata context for the current page being rendered. */
export const setMeta = (meta: Partial<Meta>) => {
	Object.assign(metaState, meta);
};

/** Get metadata about the current page being rendered. */
export const getMeta = (): Meta => {
	// immutable copy prevents inadvertent mutations
	return Object.freeze({
		...metaState,
		config: { ...metaState.config },
		breadcrumbs: [...metaState.breadcrumbs],
	});
};
