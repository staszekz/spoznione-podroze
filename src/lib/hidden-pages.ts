/** Absolute URLs of the collaboration page (PL and EN), with or without a trailing slash. */
const COLLAB_PAGE = /^https?:\/\/[^/]+\/(wspolpraca|en\/work-with-me)\/?$/;

/**
 * Sitemap filter: false for pages hidden until they have content. Matches the
 * whole path, so a post slug like `/islandia/wspolpraca/` stays in.
 */
export function inSitemap(url: string, collabPageLive: boolean): boolean {
	return collabPageLive || !COLLAB_PAGE.test(url);
}
