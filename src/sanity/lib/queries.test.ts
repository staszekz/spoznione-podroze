import { describe, expect, it, vi } from "vitest";
import { type Lang, postPath } from "@/i18n/ui";
import { postsFeed } from "@/lib/rss";
import {
	getContinentPosts,
	getContinents,
	getHomepageData,
	getLatestPosts,
	getPost,
	getPostSlugs,
} from "./queries";

// The real GROQ queries run in-memory (groq-js) against the dataset below, so
// the filters are tested, not mocked. The dataset mimics an import made
// outside Studio, where `required` validation never ran.
const dataset = vi.hoisted((): Record<string, unknown>[] => []);

vi.mock("sanity:client", async () => {
	const { evaluate, parse } = await import("groq-js");
	return {
		sanityClient: {
			fetch: async (query: string, params: Record<string, unknown>) =>
				(await evaluate(parse(query, { params }), { dataset, params })).get(),
		},
	};
});

const ref = (id: string) => ({ _type: "reference", _ref: id });
const slug = (current: string) => ({ _type: "slug", current });
const location = { lat: 0, lng: 0 };

function post(
	_id: string,
	language: Lang,
	publishedAt: string,
	fields: Record<string, unknown>,
) {
	return { _id, _type: "post", language, title: _id, publishedAt, ...fields };
}

dataset.push(
	{
		_id: "europe",
		_type: "continent",
		name: { pl: "Europa", en: "Europe" },
		slug: { pl: slug("europa"), en: slug("europe") },
		location,
	},
	{
		_id: "italy",
		_type: "country",
		name: { pl: "Włochy", en: "Italy" },
		slug: { pl: slug("wlochy"), en: slug("italy") },
		continent: ref("europe"),
		location,
	},
	// No EN slug: its EN posts have no URL.
	{
		_id: "norway",
		_type: "country",
		name: { pl: "Norwegia", en: "Norway" },
		slug: { pl: slug("norwegia") },
		continent: ref("europe"),
		location,
	},
	// Its only posts are broken, so it must not count as a country with stories.
	// The EN slug is empty: `defined("")` is true in GROQ.
	{
		_id: "iceland",
		_type: "country",
		name: { pl: "Islandia", en: "Iceland" },
		slug: { pl: slug("islandia"), en: slug("") },
		continent: ref("europe"),
		location,
	},
	// Valid posts.
	post("rome", "pl", "2026-03-01", {
		slug: slug("rzym"),
		country: ref("italy"),
	}),
	post("venice", "pl", "2026-02-01", {
		slug: slug("wenecja"),
		country: ref("italy"),
		featured: true,
	}),
	post("fjords", "pl", "2026-01-01", {
		slug: slug("fiordy"),
		country: ref("norway"),
	}),
	post("milan", "pl", "2025-01-01", {
		slug: slug("mediolan"),
		country: ref("italy"),
	}),
	post("rome-en", "en", "2026-03-01", {
		slug: slug("rome"),
		country: ref("italy"),
	}),
	// Broken posts, all newer than the valid ones: without the filter they
	// would take the top list slots and the newest-post link of each country.
	post("no-slug", "pl", "2026-05-01", { country: ref("italy") }),
	post("iceland-no-slug", "pl", "2026-05-01", { country: ref("iceland") }),
	post("empty-title", "pl", "2026-05-01", {
		title: "",
		slug: slug("pusty-tytul"),
		country: ref("italy"),
	}),
	post("no-title", "pl", "2026-05-01", {
		title: undefined,
		slug: slug("bez-tytulu"),
		country: ref("italy"),
	}),
	post("iceland-en", "en", "2026-05-01", {
		slug: slug("reykjavik"),
		country: ref("iceland"),
	}),
	post("empty-slug", "pl", "2026-05-01", {
		slug: slug(""),
		country: ref("italy"),
	}),
	post("no-country", "pl", "2026-05-01", { slug: slug("bez-kraju") }),
	post("deleted-country", "pl", "2026-05-01", {
		slug: slug("zly-kraj"),
		country: ref("country-that-was-deleted"),
	}),
	post("fjords-en", "en", "2026-05-01", {
		slug: slug("fjords"),
		country: ref("norway"),
	}),
);

const PL_ROUTES = [
	"/wlochy/rzym",
	"/wlochy/wenecja",
	"/norwegia/fiordy",
	"/wlochy/mediolan",
];
const EN_ROUTES = ["/en/italy/rome"];

/** The post pages the build generates (getStaticPaths uses getPostSlugs). */
async function generatedRoutes(lang: Lang): Promise<string[]> {
	const slugs = await getPostSlugs(lang);
	return slugs.map((post) => postPath(lang, post.country, post.slug));
}

describe("post lists link only to generated post pages", () => {
	// Guard: the fixtures really produce the expected pages, so the link checks
	// below compare against something meaningful.
	it("generates pages only for posts with a full URL", async () => {
		expect((await generatedRoutes("pl")).sort()).toEqual([...PL_ROUTES].sort());
		expect(await generatedRoutes("en")).toEqual(EN_ROUTES);
	});

	for (const lang of ["pl", "en"] as const) {
		it(`every ${lang.toUpperCase()} list, popup and feed link has a page`, async () => {
			const routes = new Set(await generatedRoutes(lang));
			const toPath = (post: {
				slug: string;
				country: { slug: string } | null;
			}) => postPath(lang, post.country?.slug ?? "", post.slug);

			const home = await getHomepageData(lang);
			const links = [
				...(await getLatestPosts(lang)).map(toPath),
				...(await getContinentPosts(lang, "europe")).map(toPath),
				...home.stories.map(toPath),
				// Map popups link to the country's newest post.
				...home.countries.flatMap((country) =>
					country.latestPost
						? [postPath(lang, country.slug, country.latestPost.slug)]
						: [],
				),
			];
			for (const route of routes) {
				const [, countrySlug, postSlug] =
					route.match(/([^/]+)\/([^/]+)$/) ?? [];
				const detail = await getPost(lang, countrySlug, postSlug);
				links.push(...(detail?.related ?? []).map(toPath));
			}
			const feed = await (await postsFeed(lang, undefined)).text();
			const feedLinks = [
				...feed.matchAll(/<item>.*?<link>([^<]+)<\/link>/gs),
			].map(([, url]) => new URL(url).pathname.replace(/\/$/, ""));

			expect(feedLinks.length).toBe(routes.size);
			for (const link of [...links, ...feedLinks]) {
				expect(routes, `${link} has no page`).toContain(link);
			}
		});
	}

	it("counts only posts that have a page", async () => {
		const [plHome, enHome] = await Promise.all([
			getHomepageData("pl"),
			getHomepageData("en"),
		]);
		expect(plHome.continents[0].postCount).toBe(PL_ROUTES.length);
		expect(enHome.continents[0].postCount).toBe(EN_ROUTES.length);

		// Iceland has a slug but only a broken post, so it does not count.
		const [plContinent] = await getContinents("pl");
		expect(plContinent).toMatchObject({ postCount: 4, countryCount: 2 });
		// Norway's only EN post has no page, so Norway does not count in EN.
		const [enContinent] = await getContinents("en");
		expect(enContinent).toMatchObject({ postCount: 1, countryCount: 1 });
	});

	it("keeps the order and limits of valid posts", async () => {
		const ids = (posts: { _id: string }[]) => posts.map((post) => post._id);
		const home = await getHomepageData("pl");

		// Newest first; broken newer posts do not push valid ones out.
		expect(ids(await getLatestPosts("pl"))).toEqual([
			"rome",
			"venice",
			"fjords",
			"milan",
		]);
		// Featured first, then newest, at most 3 per continent.
		expect(ids(home.stories)).toEqual(["venice", "rome", "fjords"]);
		// Country name in the page's alphabet, then newest first.
		expect(ids(await getContinentPosts("pl", "europe"))).toEqual([
			"fjords",
			"rome",
			"venice",
			"milan",
		]);
		// Related posts: same country, newest first, the broken newer sibling left out.
		const rome = await getPost("pl", "wlochy", "rzym");
		expect(ids(rome?.related ?? [])).toEqual(["venice", "milan"]);
		const italy = home.countries.find((country) => country._id === "italy");
		expect(italy?.latestPost).toEqual({ title: "rome", slug: "rzym" });
		// No EN slug: no EN page to link to, so no pin on the EN map. Iceland's
		// only PL post is broken: its PL pin stays, without a popup link.
		const enPins = (await getHomepageData("en")).countries;
		expect(ids(enPins)).not.toContain("norway");
		const iceland = home.countries.find((country) => country._id === "iceland");
		expect(iceland?.latestPost).toBeNull();
	});
});
