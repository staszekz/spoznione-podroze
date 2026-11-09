// HTTP smoke test of the blog at any address: what a reader and a search engine
// see, not the Cloudflare configuration. Runs on Node 24 without a build step.
// Usage and flags: see USAGE below, or `pnpm smoke --help`.

import { canonical, hasNoindex, xmlError } from "./smoke-checks.ts";

const USAGE = `Usage: pnpm smoke <base-url> [--production | --preview]

  pnpm smoke http://localhost:8787                  local wrangler dev (pnpm preview:cf)
  pnpm smoke https://<preview>.workers.dev --preview
  pnpm smoke https://spoznionepodroze.pl --production

Always checked:
  /, /en/                 200 with the blog title
  /sitemap-index.xml      200, child sitemaps 200
  one PL and one EN post  200, URLs taken from the sitemap, page is a BlogPosting
  /rss.xml, /en/rss.xml   well-formed RSS whose items link only to same-language
                          posts in the sitemap (same origin); sitemaps well-formed
  a missing path          404 with the blog's 404 page
  headers                 HSTS, nosniff, Referrer-Policy; HTML not cached as
                          immutable; a hashed /_astro/ asset cached as immutable

--production  http:// redirects to https://, www. redirects 301 to the apex with
              the path kept, and pages carry no noindex
--preview     pages carry X-Robots-Tag: noindex

Exit code 1 when a check fails, 2 on wrong arguments.`;

const SITE_TITLE = "Spóźnione Podróże";
const NOT_FOUND_TEXT = "Nie znaleziono strony";
// First path segment of continent pages (routes in src/i18n/ui.ts): not posts.
const CONTINENTS_SEGMENT = { pl: "kontynenty", en: "continents" };

type Lang = "pl" | "en";

interface Page {
	url: string;
	status: number;
	headers: Headers;
	body: string;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
	console.log(USAGE);
	process.exit(0);
}
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.filter((arg) => !arg.startsWith("--"));
const unknownFlags = [...flags].filter(
	(flag) => flag !== "--production" && flag !== "--preview",
);
if (
	positional.length !== 1 ||
	!/^https?:\/\/[^/]/.test(positional[0]) ||
	!URL.canParse(positional[0]) ||
	unknownFlags.length > 0 ||
	(flags.has("--production") && flags.has("--preview"))
) {
	console.error(USAGE);
	process.exit(2);
}
const base = new URL(positional[0]);
const production = flags.has("--production");
const preview = flags.has("--preview");

let passed = 0;
const failures: string[] = [];

function check(ok: boolean, label: string, detail: string): boolean {
	if (ok) {
		passed++;
		console.log(`✓ ${label}`);
	} else {
		failures.push(`${label}: ${detail}`);
		console.log(`✗ ${label}: ${detail}`);
	}
	return ok;
}

/** fetch() hides the network error (ECONNREFUSED, ENOTFOUND, timeout) in `cause`. */
function reason(error: unknown): string {
	const cause = (error as { cause?: { code?: string; message?: string } })
		.cause;
	return cause?.code ?? cause?.message ?? String(error);
}

/** GET without following redirects, so a redirect never passes as a page. */
async function fetchPage(target: string | URL): Promise<Page | null> {
	const url = new URL(target, base);
	try {
		const response = await fetch(url, {
			redirect: "manual",
			signal: AbortSignal.timeout(15_000),
		});
		return {
			url: url.href,
			status: response.status,
			headers: response.headers,
			body: await response.text(),
		};
	} catch (error) {
		check(false, `GET ${url.href}`, `request failed: ${reason(error)}`);
		return null;
	}
}

function expectStatus(page: Page, expected: number): boolean {
	return check(
		page.status === expected,
		`GET ${page.url} → ${expected}`,
		`expected ${expected}, got ${page.status}`,
	);
}

function pathOf(url: string): string {
	return new URL(url).pathname;
}

/** The sitemap points at the canonical domain: rebase it on the tested host. */
function onBase(href: string): URL {
	const url = new URL(href, base);
	return new URL(url.pathname + url.search, base);
}

function locs(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc.trim());
}

function isPostUrl(url: string, lang: Lang): boolean {
	const segments = pathOf(url).split("/").filter(Boolean);
	if (lang === "en") {
		return (
			segments.length === 3 &&
			segments[0] === "en" &&
			segments[1] !== CONTINENTS_SEGMENT.en
		);
	}
	return (
		segments.length === 2 &&
		segments[0] !== "en" &&
		segments[0] !== CONTINENTS_SEGMENT.pl
	);
}

async function checkHomepage(path: string): Promise<Page | null> {
	const page = await fetchPage(path);
	if (page && expectStatus(page, 200)) {
		check(
			page.body.includes(SITE_TITLE),
			`${path} shows the blog title`,
			`"${SITE_TITLE}" not found in the HTML`,
		);
	}
	return page;
}

function checkXml(page: Page, label: string): boolean {
	const error = xmlError(page.body);
	return check(!error, `${label} is well-formed XML`, error ?? "");
}

/** Absolute sitemap URLs as listed (canonical origin), trailing slash added. */
async function sitemapUrls(): Promise<string[]> {
	const index = await fetchPage("/sitemap-index.xml");
	if (!index || !expectStatus(index, 200)) return [];
	if (!checkXml(index, "/sitemap-index.xml")) return [];
	const urls: string[] = [];
	for (const loc of locs(index.body)) {
		const sitemap = await fetchPage(onBase(loc));
		if (sitemap && expectStatus(sitemap, 200) && checkXml(sitemap, loc)) {
			urls.push(...locs(sitemap.body).map((url) => canonical(url, base)));
		}
	}
	check(urls.length > 0, "sitemap lists pages", "no <loc> entries found");
	return urls;
}

async function checkPost(posts: string[], lang: Lang): Promise<Page | null> {
	const label = lang === "en" ? "/en/{country}/{slug}/" : "/{country}/{slug}/";
	if (
		!check(
			posts.length > 0,
			`${lang.toUpperCase()} post listed in the sitemap`,
			`no ${label} URL in the sitemap, so no post page was tested`,
		)
	) {
		return null;
	}
	const page = await fetchPage(onBase(posts[0]));
	if (page && expectStatus(page, 200)) {
		check(
			/"@type":\s*"BlogPosting"/.test(page.body),
			`${pathOf(posts[0])} is a post page`,
			"no BlogPosting JSON-LD in the HTML",
		);
	}
	return page;
}

async function checkFeed(path: string, posts: Set<string>, lang: Lang) {
	const feed = await fetchPage(path);
	if (!feed || !expectStatus(feed, 200)) return;
	const type = feed.headers.get("content-type") ?? "";
	check(
		type.includes("xml") && /<rss[\s>]/.test(feed.body),
		`${path} is RSS`,
		`content-type "${type}", <rss> ${/<rss[\s>]/.test(feed.body) ? "found" : "missing"}`,
	);
	// A feed reader rejects the whole feed on one parse error: links mean nothing then.
	if (!checkXml(feed, path)) return;
	// Absolute links, origin kept: a post path on the wrong host is still broken.
	// Each link is read inside its own <item>: a lazy match across items would
	// let an item without a <link> borrow the next item's.
	const items = feed.body.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
	const links = items.flatMap((item) => {
		const link = item.match(/<link>([^<]+)<\/link>/)?.[1];
		return link ? [canonical(link.trim(), feed.url)] : [];
	});
	check(
		links.length === items.length,
		`${path} items all have a link`,
		`${items.length - links.length} of ${items.length} items have no <link>`,
	);
	const langPosts = [...posts].filter((post) => isPostUrl(post, lang));
	check(
		links.length > 0 || langPosts.length === 0,
		`${path} has items`,
		`no <item> although the sitemap lists ${langPosts.length} posts`,
	);
	// Same language only: a PL feed linking EN posts would still be a bug.
	const own = new Set(langPosts);
	const missing = links.filter((link) => !own.has(link));
	check(
		missing.length === 0,
		`${path} links only to ${lang.toUpperCase()} posts in the sitemap`,
		`not a ${lang.toUpperCase()} post in the sitemap: ${missing.join(", ")}`,
	);
	// The sitemap comes from the same build, so also load one linked page.
	if (links.length > 0 && missing.length === 0) {
		const first = await fetchPage(onBase(links[0]));
		if (first) expectStatus(first, 200);
	}
}

async function checkNotFound() {
	const path = `/smoke-test-missing-${Date.now()}/`;
	const page = await fetchPage(path);
	if (page && expectStatus(page, 404)) {
		check(
			page.body.includes(NOT_FOUND_TEXT),
			`${path} shows the blog's 404 page`,
			`"${NOT_FOUND_TEXT}" not found in the HTML`,
		);
	}
}

function checkSecurityHeaders(page: Page) {
	const headers = page.headers;
	check(
		/max-age=[1-9]\d*/.test(headers.get("strict-transport-security") ?? ""),
		`${page.url} sends HSTS`,
		`Strict-Transport-Security: "${headers.get("strict-transport-security")}"`,
	);
	check(
		headers.get("x-content-type-options") === "nosniff",
		`${page.url} sends nosniff`,
		`X-Content-Type-Options: "${headers.get("x-content-type-options")}"`,
	);
	check(
		Boolean(headers.get("referrer-policy")),
		`${page.url} sends Referrer-Policy`,
		"header missing",
	);
	// HTML must revalidate, or a Sanity rebuild would not show up.
	const cache = headers.get("cache-control") ?? "";
	check(
		!cache.includes("immutable"),
		`${page.url} HTML is not cached as immutable`,
		`Cache-Control: "${cache}"`,
	);
}

async function checkAssetCache(home: Page) {
	const asset = home.body.match(/\/_astro\/[^"'\s)]+\.(?:css|js)/)?.[0];
	if (
		!check(
			Boolean(asset),
			"homepage references a hashed /_astro/ asset",
			"none found in the HTML",
		)
	) {
		return;
	}
	const page = await fetchPage(asset as string);
	if (page && expectStatus(page, 200)) {
		const cache = page.headers.get("cache-control") ?? "";
		check(
			cache.includes("immutable") && cache.includes("max-age=31536000"),
			`${asset} is cached as immutable for a year`,
			`Cache-Control: "${cache}"`,
		);
	}
}

async function expectRedirect(
	from: URL,
	statuses: number[],
	to: URL,
	label: string,
) {
	try {
		const response = await fetch(from, {
			redirect: "manual",
			signal: AbortSignal.timeout(15_000),
		});
		const location = response.headers.get("location");
		const target = location ? new URL(location, from).href : null;
		check(
			statuses.includes(response.status) && target === to.href,
			label,
			`GET ${from.href}: expected ${statuses.join("/")} to ${to.href}, got ${response.status} to ${target}`,
		);
	} catch (error) {
		check(false, label, `GET ${from.href} failed: ${reason(error)}`);
	}
}

async function checkProductionRedirects() {
	check(
		base.protocol === "https:",
		"base URL uses https",
		`got ${base.protocol}`,
	);
	const path = "/en/?smoke=1";
	const http = new URL(path, base);
	http.protocol = "http:";
	await expectRedirect(http, [301, 308], new URL(path, base), "http → https");
	const www = new URL(path, base);
	www.hostname = `www.${base.hostname}`;
	await expectRedirect(
		www,
		[301],
		new URL(path, base),
		"www → apex (301, path kept)",
	);
}

console.log(
	`Smoke test of ${base.origin}${production ? " (production)" : preview ? " (preview)" : ""}\n`,
);

const home = await checkHomepage("/");
const homeEn = await checkHomepage("/en/");
const urls = await sitemapUrls();
const posts = new Set(
	urls.filter((url) => isPostUrl(url, "pl") || isPostUrl(url, "en")),
);
const postPl = await checkPost(
	urls.filter((url) => isPostUrl(url, "pl")),
	"pl",
);
const postEn = await checkPost(
	urls.filter((url) => isPostUrl(url, "en")),
	"en",
);
await checkFeed("/rss.xml", posts, "pl");
await checkFeed("/en/rss.xml", posts, "en");
await checkNotFound();
if (home?.status === 200) {
	checkSecurityHeaders(home);
	await checkAssetCache(home);
}

const indexable = [home, homeEn, postPl, postEn].filter(
	(page): page is Page => page?.status === 200,
);
if (production) {
	await checkProductionRedirects();
	for (const page of indexable) {
		check(
			!hasNoindex(page.headers.get("x-robots-tag"), page.body),
			`${page.url} is indexable`,
			"noindex in X-Robots-Tag or a robots meta tag",
		);
	}
}
if (preview) {
	for (const page of indexable) {
		check(
			hasNoindex(page.headers.get("x-robots-tag"), ""),
			`${page.url} sends X-Robots-Tag: noindex`,
			`X-Robots-Tag: "${page.headers.get("x-robots-tag")}"`,
		);
	}
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
	console.log(
		`\nFailures:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
	);
	process.exit(1);
}
