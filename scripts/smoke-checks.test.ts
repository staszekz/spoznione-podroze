import { describe, expect, it } from "vitest";
import { canonical, hasNoindex, xmlError } from "./smoke-checks";

describe("xmlError: a feed must parse, not just mention <rss>", () => {
	it("accepts a well-formed feed", () => {
		expect(
			xmlError("<rss><channel><title>Ogień &amp; lód</title></channel></rss>"),
		).toBeNull();
	});

	it("rejects an unescaped ampersand and a truncated document", () => {
		expect(xmlError("<rss><channel><title>R&D</title>")).toMatch(/line 1/);
		expect(xmlError("<rss><channel><title>ok</title>")).not.toBeNull();
	});
});

describe("canonical: feed links compare with their origin", () => {
	const sitemap = new Set([
		canonical("https://spoznionepodroze.pl/wlochy/rzym/"),
	]);

	it("matches the same post with or without a trailing slash", () => {
		expect(
			sitemap.has(canonical("https://spoznionepodroze.pl/wlochy/rzym")),
		).toBe(true);
	});

	it("does not match the same path on another host", () => {
		// A reader following this link lands on a dead host, even though
		// /wlochy/rzym/ exists on the deployment under test.
		expect(sitemap.has(canonical("https://wrong.invalid/wlochy/rzym/"))).toBe(
			false,
		);
	});
});

describe("hasNoindex: any robots directive that removes the page from search", () => {
	it("reads the meta tag whatever the attribute order and quoting", () => {
		expect(hasNoindex(null, '<meta name="robots" content="noindex">')).toBe(
			true,
		);
		expect(hasNoindex(null, '<meta content="noindex" name="robots">')).toBe(
			true,
		);
		expect(
			hasNoindex(null, "<META NAME='Robots' CONTENT='NoIndex, follow'>"),
		).toBe(true);
		expect(hasNoindex(null, '<meta name="googlebot" content="none">')).toBe(
			true,
		);
	});

	it("reads the X-Robots-Tag header, with or without a user agent", () => {
		expect(hasNoindex("noindex", "")).toBe(true);
		expect(hasNoindex("googlebot: noindex, nofollow", "")).toBe(true);
	});

	it("leaves indexable pages alone", () => {
		expect(
			hasNoindex(null, '<meta name="robots" content="index, follow">'),
		).toBe(false);
		expect(
			hasNoindex(null, '<meta name="description" content="noindex tips">'),
		).toBe(false);
		expect(hasNoindex("nofollow", "")).toBe(false);
	});
});
