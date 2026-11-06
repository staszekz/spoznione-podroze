import { defineArrayMember, defineField, defineType } from "sanity";
import { SOCIAL_PLATFORMS } from "../socials";

// One document per person: the About page lists them, and posts will
// reference them once a second author writes (per-post author, after launch).
export const author = defineType({
	name: "author",
	title: "Author",
	type: "document",
	fields: [
		defineField({
			name: "name",
			title: "Name",
			description: "Shown publicly. First name only is fine.",
			type: "string",
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: "photo",
			title: "Photo",
			type: "image",
			options: { hotspot: true },
			fields: [
				defineField({ name: "alt", title: "Alternative text", type: "string" }),
			],
		}),
		defineField({
			name: "bio",
			title: "Short bio",
			description: "2–3 sentences next to the photo.",
			type: "object",
			fields: [
				defineField({ name: "pl", title: "Polski", type: "text", rows: 3 }),
				defineField({ name: "en", title: "English", type: "text", rows: 3 }),
			],
		}),
		defineField({
			name: "socials",
			title: "Social links",
			type: "array",
			of: [
				defineArrayMember({
					type: "object",
					name: "socialLink",
					fields: [
						defineField({
							name: "platform",
							title: "Platform",
							type: "string",
							options: { list: SOCIAL_PLATFORMS },
							validation: (rule) => rule.required(),
						}),
						defineField({
							name: "url",
							title: "URL",
							type: "url",
							validation: (rule) => rule.required(),
						}),
					],
					preview: { select: { title: "platform", subtitle: "url" } },
				}),
			],
		}),
	],
	preview: {
		select: { title: "name", media: "photo" },
	},
});
