import { defineArrayMember, defineField, defineType } from "sanity";

// Sanity extracts image metadata only at upload, and only the keys listed here.
// Listing them replaces the defaults, so lqip/blurhash/palette must stay explicit.
// exif + location (GPS) feed the map and lightbox captions later (LAN-163).
const imageMetadata: ("blurhash" | "lqip" | "palette" | "exif" | "location")[] =
	["blurhash", "lqip", "palette", "exif", "location"];

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
			options: { source: "title" },
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
			fields: [
				defineField({ name: "alt", title: "Alternative text", type: "string" }),
			],
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
						defineField({
							name: "alt",
							title: "Alternative text",
							type: "string",
						}),
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
						defineField({
							name: "alt",
							title: "Alternative text",
							type: "string",
						}),
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
