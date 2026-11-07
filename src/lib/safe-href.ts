// Content comes from the CMS (and from API imports that skip Studio
// validation): only web, mail and phone links may become real links.
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Whether a Portable Text link `href` may be rendered as `<a href>`.
 * `URL` normalises the scheme like a browser does (case, leading spaces,
 * tabs), so `" JavaScript:"` is caught. Relative paths resolve against the
 * dummy base and pass as https. Empty hrefs would link to the current page.
 * Takes `unknown`: API imports can store a number or object, and a throw here
 * would abort the static build of the whole page.
 */
export function isSafeHref(href: unknown): href is string {
	if (typeof href !== "string" || href.trim() === "") return false;
	try {
		return SAFE_PROTOCOLS.has(new URL(href, "https://base.invalid").protocol);
	} catch {
		return false;
	}
}
