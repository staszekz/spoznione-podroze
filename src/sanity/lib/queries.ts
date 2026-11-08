import { sanityClient } from "sanity:client";
import type { TypedObject } from "astro-portabletext/types";
import { defineQuery } from "groq";
import type { Lang } from "@/i18n/ui";

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
		"name": name[$lang],
		"slug": slug[$lang].current,
		"continentId": continent._ref
	}
`;

export interface SanityImage {
	asset: {
		_id: string;
		url: string;
		metadata?: {
			lqip?: string;
			dimensions?: { width: number; height: number };
		};
	} | null;
	hotspot?: unknown;
	/** Fractions (0–1) cut off each edge in the Studio crop tool. */
	crop?: { top: number; bottom: number; left: number; right: number } | null;
	alt?: string | null;
}

export interface ContinentSummary {
	_id: string;
	name: string;
	slug: string;
	location: { lat: number; lng: number };
	image: SanityImage | null;
	postCount: number;
}

export interface StoryCard {
	_id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	readingTime: number | null;
	photoCount: number | null;
	tripDate: string | null;
	coverImage: SanityImage | null;
	country: {
		name: string;
		slug: string;
		continentId: string;
	} | null;
}

export interface CountryPin {
	_id: string;
	name: string;
	slug: string;
	location: { lat: number; lng: number };
	continentId: string;
	image: SanityImage | null;
	latestPost: { title: string; slug: string } | null;
}

export interface HomepageData {
	continents: ContinentSummary[];
	/** Up to 3 stories per continent, featured first, then newest. */
	stories: StoryCard[];
	shareCover: SanityImage | null;
	countries: CountryPin[];
}

// `stories`: FeaturedStories shows at most 3 stories per continent, so only
// those are fetched (`.items[]` flattens the per-continent lists), not the
// whole archive. `shareCover`: the cover of the first featured (or newest)
// story overall, for the homepage share image.
const HOMEPAGE_QUERY = defineQuery(/* groq */ `{
	"continents": *[_type == "continent"] | order(name[$lang] asc) {
		_id,
		"name": name[$lang],
		"slug": slug[$lang].current,
		location,
		image { ${imageFragment} },
		"postCount": count(*[_type == "post" && language == $lang && country->continent._ref == ^._id])
	},
	"stories": *[_type == "continent"] {
		"items": *[_type == "post" && language == $lang && country->continent._ref == ^._id]
			| order(coalesce(featured, false) desc, publishedAt desc)[0...3] {
			${postCardFragment}
		}
	}.items[],
	"shareCover": *[_type == "post" && language == $lang]
		| order(coalesce(featured, false) desc, publishedAt desc)[0].coverImage { ${imageFragment} },
	"countries": *[_type == "country"] {
		_id,
		"name": name[$lang],
		"slug": slug[$lang].current,
		location,
		"continentId": continent._ref,
		image { ${imageFragment} },
		"latestPost": *[_type == "post" && language == $lang && references(^._id)]
			| order(publishedAt desc)[0] { title, "slug": slug.current }
	}
}`);

export async function getHomepageData(lang: Lang): Promise<HomepageData> {
	const data: HomepageData = await sanityClient.fetch(HOMEPAGE_QUERY, { lang });
	// Pills render in array order — most published continent (the default) first.
	data.continents.sort((a, b) => b.postCount - a.postCount);
	return data;
}

// The country filter keeps posts with a missing/unresolved country ref out of
// the result, so getStaticPaths never emits `/undefined/slug`.
const POST_SLUGS_QUERY = defineQuery(/* groq */ `
	*[_type == "post" && defined(slug.current) && language == $lang && defined(country->slug[$lang].current)] {
		"slug": slug.current,
		"country": country->slug[$lang].current
	}
`);

export async function getPostSlugs(
	lang: Lang,
): Promise<{ slug: string; country: string }[]> {
	return await sanityClient.fetch(POST_SLUGS_QUERY, { lang });
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
		"related": *[_type == "post" && language == $lang && _id != ^._id
			&& country._ref == ^.country._ref && defined(slug.current)
			&& defined(country->slug[$lang].current)]
			| order(publishedAt desc)[0...3] {
			${postCardFragment}
		}
	}
`);

export interface CaptionedImage extends SanityImage {
	_key: string;
	caption?: string | null;
}

export interface PostTranslation {
	language: string | null;
	slug: string | null;
	country: string | null;
}

export interface PostDetail extends LatestPost {
	updatedAt: string | null;
	updateNote: string | null;
	body: TypedObject[] | null;
	gallery: CaptionedImage[] | null;
	/** Every language version of this post, the current one included. */
	translations: (PostTranslation | null)[] | null;
	related: LatestPost[];
}

export async function getPost(
	lang: Lang,
	country: string,
	slug: string,
): Promise<PostDetail | null> {
	return await sanityClient.fetch(POST_QUERY, { lang, country, slug });
}

export interface LatestPost {
	_id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	readingTime: number | null;
	photoCount: number | null;
	publishedAt: string | null;
	tripDate: string | null;
	coverImage: SanityImage | null;
	country: { name: string; slug: string };
}

const LATEST_POSTS_QUERY = defineQuery(/* groq */ `
	*[_type == "post" && language == $lang && defined(country->slug[$lang].current)]
		| order(publishedAt desc) {
		${postCardFragment}
	}
`);

export async function getLatestPosts(lang: Lang): Promise<LatestPost[]> {
	return await sanityClient.fetch(LATEST_POSTS_QUERY, { lang });
}

export interface SocialLink {
	_key: string;
	platform: string;
	url: string;
}

export interface AuthorProfile {
	_id: string;
	name: string;
	bio: string | null;
	photo: SanityImage | null;
	socials: SocialLink[] | null;
}

export interface AboutPageData {
	lead: string | null;
	story: TypedObject[] | null;
	email: string | null;
	authors: AuthorProfile[] | null;
}

// Fixed id (see ABOUT_PAGE_ID): only the published singleton, never a stray copy.
const ABOUT_PAGE_QUERY = defineQuery(/* groq */ `
	*[_id == "aboutPage"][0] {
		"lead": lead[$lang],
		"story": story[$lang],
		email,
		"authors": authors[]->{
			_id,
			name,
			"bio": bio[$lang],
			photo { ${imageFragment} },
			socials[] { _key, platform, url }
		}
	}
`);

export async function getAboutPage(lang: Lang): Promise<AboutPageData | null> {
	return await sanityClient.fetch(ABOUT_PAGE_QUERY, { lang });
}

export interface ContinentListItem {
	_id: string;
	name: string;
	slug: string;
	/** Slugs in both languages, for the language switch on the continent page. */
	slugs: { pl: string | null; en: string | null };
	image: SanityImage | null;
	countryCount: number;
	postCount: number;
}

// Continents without a post in this language are left out: their page would be empty.
const CONTINENTS_QUERY = defineQuery(/* groq */ `
	*[_type == "continent" && defined(slug[$lang].current)] {
		_id,
		"name": name[$lang],
		"slug": slug[$lang].current,
		"slugs": { "pl": slug.pl.current, "en": slug.en.current },
		image { ${imageFragment} },
		"countryCount": count(*[_type == "country" && continent._ref == ^._id
			&& defined(slug[$lang].current)
			&& count(*[_type == "post" && language == $lang && defined(slug.current)
				&& country._ref == ^._id]) > 0]),
		"postCount": count(*[_type == "post" && language == $lang && defined(slug.current)
			&& defined(country->slug[$lang].current) && country->continent._ref == ^._id])
	}[postCount > 0]
`);

export async function getContinents(lang: Lang): Promise<ContinentListItem[]> {
	const continents: ContinentListItem[] = await sanityClient.fetch(
		CONTINENTS_QUERY,
		{ lang },
	);
	// Alphabetical in the page language (GROQ would compare code points).
	return continents.sort((a, b) => a.name.localeCompare(b.name, lang));
}

const CONTINENT_POSTS_QUERY = defineQuery(/* groq */ `
	*[_type == "post" && language == $lang && defined(slug.current)
		&& defined(country->slug[$lang].current) && country->continent._ref == $continentId]
		| order(publishedAt desc) {
		${postCardFragment}
	}
`);

/** Posts of one continent, sorted by country name, then newest first. */
export async function getContinentPosts(
	lang: Lang,
	continentId: string,
): Promise<LatestPost[]> {
	const posts: LatestPost[] = await sanityClient.fetch(CONTINENT_POSTS_QUERY, {
		lang,
		continentId,
	});
	// GROQ compares code points ("Łotwa" after "Zambia"); the stable JS sort
	// orders countries by the language's alphabet and keeps newest-first within.
	return posts.sort((a, b) =>
		a.country.name.localeCompare(b.country.name, lang),
	);
}
