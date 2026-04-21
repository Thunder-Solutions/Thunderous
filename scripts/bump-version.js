/**
 * Semver bump helper shared across package `postversion.js` scripts.
 *
 * We can't rely on npm's `version` lifecycle hook env vars (`npm_old_version`,
 * `npm_new_version`) because these scripts run via `pnpm -F <pkg> version <type>`,
 * which pnpm resolves to the package's `version` script rather than npm's
 * version command — so the env vars are never populated.
 */
export function bumpVersion(version, type) {
	const [major, minor, patch] = version.split('.').map(Number);
	switch (type) {
		case 'major':
			return `${major + 1}.0.0`;
		case 'minor':
			return `${major}.${minor + 1}.0`;
		case 'patch':
			return `${major}.${minor}.${patch + 1}`;
		default:
			throw new Error(`Invalid version bump type: "${type}". Must be one of: major, minor, patch.`);
	}
}
