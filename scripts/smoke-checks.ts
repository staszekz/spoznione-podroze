// Pure checks behind scripts/smoke.ts, kept apart so they have unit tests.

import { XMLValidator } from "fast-xml-parser";

/** Why `xml` is not well-formed (a feed reader would reject it), or null. */
export function xmlError(xml: string): string | null {
	const result = XMLValidator.validate(xml);
	return result === true ? null : `line ${result.err.line}: ${result.err.msg}`;
}

/**
 * Absolute URL with a trailing slash, for comparing feed links with sitemap
 * entries. The origin is kept: a link to another host is a broken link even
 * when its path exists on the tested one.
 */
export function canonical(href: string, base?: string | URL): string {
	const url = new URL(href, base);
	url.pathname = url.pathname.replace(/\/?$/, "/");
	url.hash = "";
	return url.href;
}

/** `noindex`/`none` in a robots directive list, e.g. "googlebot: noindex, nofollow". */
function blocksIndexing(directives: string): boolean {
	return directives
		.toLowerCase()
		.split(",")
		.map((directive) => directive.replace(/^[a-z-]+:\s*/, "").trim())
		.some((directive) => directive === "noindex" || directive === "none");
}

const META_TAG = /<meta\b[^>]*>/gi;
const ATTRIBUTE = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

function attributes(tag: string): Map<string, string> {
	const found = new Map<string, string>();
	for (const [, name, double, single, bare] of tag.matchAll(ATTRIBUTE)) {
		found.set(name.toLowerCase(), double ?? single ?? bare ?? "");
	}
	return found;
}

/**
 * Whether search engines are told not to index the page, by the X-Robots-Tag
 * header or a robots meta tag, whatever the attribute order or quoting.
 */
export function hasNoindex(xRobotsTag: string | null, html: string): boolean {
	if (xRobotsTag && blocksIndexing(xRobotsTag)) return true;
	return [...html.matchAll(META_TAG)].some(([tag]) => {
		const meta = attributes(tag);
		const name = meta.get("name")?.toLowerCase();
		return (
			(name === "robots" || name === "googlebot") &&
			blocksIndexing(meta.get("content") ?? "")
		);
	});
}
