import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/consts";
import { type Lang, postPath } from "@/i18n/ui";
import { getLatestPosts } from "@/sanity/lib/queries";

/** One RSS feed per language: readers subscribe to the language they read. */
export async function postsFeed(lang: Lang, site: URL | undefined) {
	const posts = await getLatestPosts(lang);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION[lang],
		// @astrojs/rss uses `site` as the channel <link>: point it at the feed's
		// language homepage. Item links are root-relative, so they still resolve.
		site: new URL(
			lang === "pl" ? "/" : "/en/",
			site ?? "https://spoznionepodroze.pl",
		),
		items: posts.map((post) => ({
			title: post.title,
			description: post.excerpt ?? undefined,
			pubDate: post.publishedAt ? new Date(post.publishedAt) : undefined,
			link: `${postPath(lang, post.country.slug, post.slug)}/`,
		})),
		customData: `<language>${lang}</language>`,
	});
}
