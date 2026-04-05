import { type ParsedDocument } from './render';

// Mutable state for navigation handling
export const state = {
	navigateAbort: new AbortController(),
	destResolvers: Promise.withResolvers<ParsedDocument>(),
};
