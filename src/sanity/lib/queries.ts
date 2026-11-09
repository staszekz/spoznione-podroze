import { sanityClient } from "sanity:client";
import { defineQuery } from "groq";
import type { Lang } from "@/i18n/ui";
import type { Crop } from "@/lib/crop";
import type {
	ABOUT_PAGE_QUERY_RESULT,
	CONTINENTS_QUERY_RESULT,
	HOMEPAGE_QUERY_RESULT,
	LATEST_POSTS_QUERY_RESULT,
	POST_QUERY_RESULT,
} from "@/sanity/sanity.types";

const imageFragment = /* groq */ `
	asset->{
		_id,
		url,
		metadata { lqip, dimensions { width, height } }
	},
	hotspot,
	crop,
	alt
`;

// A post in language $lang has a page only with its own slug and title and its
// country's slug and name in that language (see POST_SLUGS_QUERY). Every list
// uses this filter, so it never links to a post without a page, e.g. one
// imported outside Studio. `defined()` is true for "", so empty strings are
// excluded explicitly (the same fields `isRoutable` checks).
const routablePost = /* groq */ `_type == "post" && language == $lang
	&& defined(slug.current) && slug.current != ""
	&& defined(title) && title != ""
	&& defined(country->slug[$lang].current) && country->slug[$lang].current != ""
	&& defined(country->name[$lang]) && country->name[$lang] != ""`;

const postCardFragment = /* groq */ `
	_id,
	title,
	"slug": slug.current,
	excerpt,
	readingTime,
	photoCount,
	publishedAt,
	tripDate,
	coverImage { ${imageFragment} },
	country->{
		"name": select($lang == "en" => name.en, name.pl),
		"slug": select($lang == "en" => slug.en.current, slug.pl.current),
		"continentId": continent._ref
	}
`;

// Result types come from Sanity TypeGen (`pnpm typegen` → src/sanity/sanity.types.ts).
// Every CMS field is nullable there: Studio's `required` does not bind imports.
// TypeGen cannot see what a GROQ filter guarantees, so results are narrowed at
// runtime with the guards below (no-ops on valid data) instead of asserting
// types; components then get non-null fields.

interface RoutableShape {
	title: string | null;
	slug: string | null;
	country: { slug: string | null; name: string | null } | null;
}

/** A post with a page: what `routablePost` requires is set. */
type Routable<T extends RoutableShape> = T & {
	title: string;
	slug: string;
	country: NonNullable<T["country"]> & { slug: string; name: string };
};

function isRoutable<T extends RoutableShape>(post: T): post is Routable<T> {
	return Boolean(
		post.title && post.slug && post.country?.slug && post.country.name,
	);
}

interface PlaceShape {
	name: string | null;
	location: { lat?: number; lng?: number } | null;
}

/** A continent or country the map and the pills can show: named and placed. */
type Placed<T extends PlaceShape> = T & {
	name: string;
	location: { lat: number; lng: number };
};

function isPlaced<T extends PlaceShape>(place: T): place is Placed<T> {
	return Boolean(
		place.name &&
			typeof place.location?.lat === "number" &&
			typeof place.location.lng === "number",
	);
}

/** What `<SanityImage>` needs; every image projection must stay assignable to it. */
export interface SanityImage {
	asset: {
		_id: string;
		url: string | null;
		metadata?: {
			lqip?: string | null;
			dimensions?: { width: number | null; height: number | null } | null;
		} | null;
	} | null;
	hotspot?: unknown;
	crop?: Crop | null;
	alt?: string | null;
}

type HomepageResult = HOMEPAGE_QUERY_RESULT;
export type ContinentSummary = Placed<HomepageResult["continents"][number]>;
// A country pin also needs its slug: the popup links to `/{country}/{post}`.
export type CountryPin = Omit<
	Placed<HomepageResult["countries"][number]> & { slug: string },
	"latestPost"
> & {
	/** Newest post with a page, for the map popup. */
	latestPost: { title: string; slug: string } | null;
};
export type StoryCard = Routable<HomepageResult["stories"][number]>;
export interface HomepageData {
	continents: ContinentSummary[];
	/** Up to 3 stories per continent, featured first, then newest. */
	stories: StoryCard[];
	shareCover: HomepageResult["shareCover"];
	countries: CountryPin[];
}
export type LatestPost = Routable<LATEST_POSTS_QUERY_RESULT[number]>;
type PostResult = NonNullable<POST_QUERY_RESULT>;
export type PostDetail = Routable<Omit<PostResult, "related">> & {
	related: LatestPost[];
};
export type CaptionedImage = NonNullable<PostDetail["gallery"]>[number];
type AboutResult = NonNullable<ABOUT_PAGE_QUERY_RESULT>;
type Author = NonNullable<AboutResult["authors"]>[number];
export type SocialLink = NonNullable<Author["socials"]>[number] & {
	platform: string;
	url: string;
};
export type AboutPageData = Omit<AboutResult, "authors"> & {
	authors: (Omit<Author, "socials"> & { socials: SocialLink[] })[] | null;
};
export type ContinentListItem = CONTINENTS_QUERY_RESULT[number] & {
	name: string;
	slug: string;
};

// `stories`: FeaturedStories shows at most 3 stories per continent, so only
// those are fetched (`.items[]` flattens the per-continent lists), not the
// whole archive. `shareCover`: the cover of the first featured (or newest)
// story overall, for the homepage share image.
const HOMEPAGE_QUERY = defineQuery(/* groq */ `{
	"continents": *[_type == "continent"] | order(name[$lang] asc) {
		_id,
		"name": select($lang == "en" => name.en, name.pl),
		"slug": select($lang == "en" => slug.en.current, slug.pl.current),
		location,
		image { ${imageFragment} },
		"postCount": count(*[${routablePost} && country->continent._ref == ^._id])
	},
	"stories": *[_type == "continent"] {
		"items": *[${routablePost} && country->continent._ref == ^._id]
			| order(coalesce(featured, false) desc, publishedAt desc)[0...3] {
			${postCardFragment}
		}
	}.items[],
	"shareCover": *[${routablePost}]
		| order(coalesce(featured, false) desc, publishedAt desc)[0].coverImage { ${imageFragment} },
	"countries": *[_type == "country"] {
		_id,
		"name": select($lang == "en" => name.en, name.pl),
		"slug": select($lang == "en" => slug.en.current, slug.pl.current),
		location,
		"continentId": continent._ref,
		image { ${imageFragment} },
		"latestPost": *[${routablePost} && references(^._id)]
			| order(publishedAt desc)[0] { title, "slug": slug.current }
	}
}`);

export async function getHomepageData(lang: Lang): Promise<HomepageData> {
	const data = await sanityClient.fetch(HOMEPAGE_QUERY, { lang });
	return {
		// Pills render in array order — most published continent (the default) first.
		continents: data.continents
			.filter(isPlaced)
			.sort((a, b) => b.postCount - a.postCount),
		stories: data.stories.filter(isRoutable),
		shareCover: data.shareCover,
		countries: data.countries
			.filter(isPlaced)
			.filter((country): country is typeof country & { slug: string } =>
				Boolean(country.slug),
			)
			.map((country) => ({
				...country,
				latestPost:
					country.latestPost?.title && country.latestPost.slug
						? { title: country.latestPost.title, slug: country.latestPost.slug }
						: null,
			})),
	};
}

// The country filter keeps posts with a missing/unresolved country ref out of
// the result, so getStaticPaths never emits `/undefined/slug`.
const POST_SLUGS_QUERY = defineQuery(/* groq */ `
	*[${routablePost}] {
		"slug": slug.current,
		"country": select($lang == "en" => country->slug.en.current, country->slug.pl.current)
	}
`);

export async function getPostSlugs(
	lang: Lang,
): Promise<{ slug: string; country: string }[]> {
	const slugs = await sanityClient.fetch(POST_SLUGS_QUERY, { lang });
	return slugs.filter((post): post is { slug: string; country: string } =>
		Boolean(post.slug && post.country),
	);
}

const POST_QUERY = defineQuery(/* groq */ `
	*[_type == "post" && language == $lang && slug.current == $slug && country->slug[$lang].current == $country][0] {
		${postCardFragment},
		updatedAt,
		updateNote,
		body[] {
			...,
			_type == "image" => { _key, _type, caption, ${imageFragment} }
		},
		gallery[] { _key, caption, ${imageFragment} },
		"translations": *[_type == "translation.metadata" && references(^._id)][0]
			.translations[].value->{
				language,
				"slug": slug.current,
				"country": select(
					language == "en" => country->slug.en.current,
					country->slug.pl.current
				)
			},
		"related": *[${routablePost} && _id != ^._id
			&& country._ref == ^.country._ref]
			| order(publishedAt desc)[0...3] {
			${postCardFragment}
		}
	}
`);

export async function getPost(
	lang: Lang,
	country: string,
	slug: string,
): Promise<PostDetail | null> {
	const post = await sanityClient.fetch(POST_QUERY, { lang, country, slug });
	if (!post || !isRoutable(post)) return null;
	return { ...post, related: post.related.filter(isRoutable) };
}

const LATEST_POSTS_QUERY = defineQuery(/* groq */ `
	*[${routablePost}]
		| order(publishedAt desc) {
		${postCardFragment}
	}
`);

export async function getLatestPosts(lang: Lang): Promise<LatestPost[]> {
	const posts = await sanityClient.fetch(LATEST_POSTS_QUERY, { lang });
	return posts.filter(isRoutable);
}

// Fixed id (see ABOUT_PAGE_ID): only the published singleton, never a stray copy.
const ABOUT_PAGE_QUERY = defineQuery(/* groq */ `
	*[_type == "aboutPage" && _id == "aboutPage"][0] {
		"lead": select($lang == "en" => lead.en, lead.pl),
		"story": select($lang == "en" => story.en, story.pl),
		email,
		"authors": authors[]->{
			_id,
			name,
			"bio": select($lang == "en" => bio.en, bio.pl),
			photo { ${imageFragment} },
			socials[] { _key, platform, url }
		}
	}
`);

export async function getAboutPage(lang: Lang): Promise<AboutPageData | null> {
	const page = await sanityClient.fetch(ABOUT_PAGE_QUERY, { lang });
	if (!page) return null;
	return {
		...page,
		// `authors[]->` yields null for a reference to a missing or draft-only
		// author, which the generated type does not show: skip it. A link without
		// a platform or URL renders as a dead anchor: skip it too.
		authors:
			page.authors?.flatMap((author) =>
				author
					? [
							{
								...author,
								socials: (author.socials ?? []).filter(
									(social): social is SocialLink =>
										Boolean(social.platform && social.url),
								),
							},
						]
					: [],
			) ?? null,
	};
}

// Continents without a post in this language are left out: their page would be empty.
const CONTINENTS_QUERY = defineQuery(/* groq */ `
	*[_type == "continent" && defined(slug[$lang].current)] {
		_id,
		"name": select($lang == "en" => name.en, name.pl),
		"slug": select($lang == "en" => slug.en.current, slug.pl.current),
		"slugs": { "pl": slug.pl.current, "en": slug.en.current },
		image { ${imageFragment} },
		"countryCount": count(*[_type == "country" && continent._ref == ^._id
			&& defined(slug[$lang].current)
			&& count(*[${routablePost} && country._ref == ^._id]) > 0]),
		"postCount": count(*[${routablePost} && country->continent._ref == ^._id])
	}[postCount > 0]
`);

export async function getContinents(lang: Lang): Promise<ContinentListItem[]> {
	const continents = await sanityClient.fetch(CONTINENTS_QUERY, { lang });
	// Alphabetical in the page language (GROQ would compare code points).
	return continents
		.filter((continent): continent is ContinentListItem =>
			Boolean(continent.name && continent.slug),
		)
		.sort((a, b) => a.name.localeCompare(b.name, lang));
}

const CONTINENT_POSTS_QUERY = defineQuery(/* groq */ `
	*[${routablePost} && country->continent._ref == $continentId]
		| order(publishedAt desc) {
		${postCardFragment}
	}
`);

/** Posts of one continent, sorted by country name, then newest first. */
export async function getContinentPosts(
	lang: Lang,
	continentId: string,
): Promise<LatestPost[]> {
	const posts = await sanityClient.fetch(CONTINENT_POSTS_QUERY, {
		lang,
		continentId,
	});
	// GROQ compares code points ("Łotwa" after "Zambia"); the stable JS sort
	// orders countries by the language's alphabet and keeps newest-first within.
	return posts
		.filter(isRoutable)
		.sort((a, b) => a.country.name.localeCompare(b.country.name, lang));
}
