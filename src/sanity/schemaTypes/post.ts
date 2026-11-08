import {
	defineArrayMember,
	defineField,
	defineType,
	getPublishedId,
} from "sanity";

// Sanity extracts image metadata only at upload, and only the keys listed here.
// Listing them replaces the defaults, so lqip/blurhash/palette must stay explicit.
// exif + location (GPS) feed the map and lightbox captions later (LAN-163).
const imageMetadata: ("blurhash" | "lqip" | "palette" | "exif" | "location")[] =
	["blurhash", "lqip", "palette", "exif", "location"];

// Empty alt renders alt="" (decorative), which hides a story photo from screen
// readers. A warning, not an error: a purely decorative photo may stay empty.
const altField = defineField({
	name: "alt",
	title: "Alternative text",
	description:
		"What the photo shows, for screen readers. Leave empty only for a purely decorative photo.",
	type: "string",
	validation: (rule) =>
		rule
			.custom((alt) =>
				alt?.trim()
					? true
					: "Describe the photo, unless it is purely decorative.",
			)
			.warning(),
});

export const post = defineType({
	name: "post",
	title: "Post",
	type: "document",
	fields: [
		defineField({
			name: "language",
			type: "string",
			readOnly: true,
			hidden: true,
		}),
		defineField({
			name: "title",
			title: "Title",
			type: "string",
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: {
				source: "title",
				// The URL is /{country}/{slug} per language, so PL and EN translations
				// may share a slug. Sanity's default check is unique across all posts.
				isUnique: async (slug, context) => {
					const { document, getClient } = context;
					const country = (document?.country as { _ref?: string } | undefined)
						?._ref;
					// No country yet: the URL is unknown and `required` already flags it.
					if (!document || !country) return true;
					const id = getPublishedId(document._id);
					return await getClient({ apiVersion: "2026-07-01" }).fetch(
						`!defined(*[_type == "post" && !(_id in [$draft, $published])
							&& slug.current == $slug && language == $language
							&& country._ref == $country][0]._id)`,
						{
							draft: `drafts.${id}`,
							published: id,
							slug,
							language: document.language ?? null,
							country,
						},
					);
				},
			},
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "excerpt",
			title: "Excerpt",
			type: "text",
			rows: 3,
			validation: (rule) =>
				rule.max(220).warning("Keep excerpts short — they render on cards."),
		}),
		defineField({
			name: "country",
			title: "Country",
			type: "reference",
			to: [{ type: "country" }],
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "coverImage",
			title: "Cover image",
			type: "image",
			options: { hotspot: true, metadata: imageMetadata },
			fields: [altField],
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "gallery",
			title: "Gallery",
			type: "array",
			of: [
				defineArrayMember({
					type: "image",
					options: { hotspot: true, metadata: imageMetadata },
					fields: [
						altField,
						defineField({
							name: "caption",
							title: "Caption",
							description: "Optional, shown under the photo.",
							type: "string",
						}),
					],
				}),
			],
		}),
		defineField({
			name: "readingTime",
			title: "Reading time (minutes)",
			type: "number",
			validation: (rule) => rule.min(1).integer(),
		}),
		defineField({
			name: "photoCount",
			title: "Photo count",
			type: "number",
			validation: (rule) => rule.min(0).integer(),
		}),
		defineField({
			name: "featured",
			title: "Featured on homepage",
			type: "boolean",
			initialValue: false,
		}),
		defineField({
			name: "tripDate",
			title: "Trip date",
			description:
				"When the trip happened (not the publish date). Month and year are enough — the day can be the 1st.",
			type: "date",
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "publishedAt",
			title: "Published at",
			type: "datetime",
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "updatedAt",
			title: "Updated at",
			description:
				"Set only for a meaningful content update, not for a typo fix. Shown to readers as “Updated: …”.",
			type: "datetime",
		}),
		defineField({
			name: "updateNote",
			title: "Update note",
			description:
				"What changed, e.g. “New ticket prices and opening hours”. Shown next to the update date.",
			type: "string",
			validation: (rule) => rule.max(140),
		}),
		defineField({
			name: "location",
			title: "Location",
			description:
				"Main place of the story, e.g. a city or a park. Copy coordinates from Google Maps (right-click the place).",
			type: "geopoint",
		}),
		defineField({
			name: "body",
			title: "Body",
			type: "array",
			of: [
				defineArrayMember({ type: "block" }),
				defineArrayMember({
					type: "image",
					options: { hotspot: true, metadata: imageMetadata },
					fields: [
						altField,
						defineField({
							name: "caption",
							title: "Caption",
							description: "Optional, shown under the photo.",
							type: "string",
						}),
					],
				}),
			],
		}),
	],
	preview: {
		select: {
			title: "title",
			subtitle: "language",
			media: "coverImage",
		},
	},
});
