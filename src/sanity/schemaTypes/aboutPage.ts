import { defineArrayMember, defineField, defineType } from "sanity";

/** Fixed document id: the Studio opens this one document instead of a list. */
export const ABOUT_PAGE_ID = "aboutPage";

const storyField = (name: "pl" | "en", title: string) =>
	defineField({
		name,
		title,
		type: "array",
		of: [defineArrayMember({ type: "block" })],
	});

export const aboutPage = defineType({
	name: "aboutPage",
	title: "About page",
	type: "document",
	fields: [
		defineField({
			name: "lead",
			title: "Lead",
			description:
				"One or two sentences under the heading. Also used as the page description in Google and link previews.",
			type: "object",
			fields: [
				defineField({ name: "pl", title: "Polski", type: "text", rows: 2 }),
				defineField({ name: "en", title: "English", type: "text", rows: 2 }),
			],
		}),
		defineField({
			name: "story",
			title: "Story of the blog",
			description: "Who writes it and where the name comes from.",
			type: "object",
			fields: [storyField("pl", "Polski"), storyField("en", "English")],
		}),
		defineField({
			name: "authors",
			title: "Authors",
			type: "array",
			of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
		}),
		defineField({
			name: "email",
			title: "Contact email",
			description: "Shown as a “write to me” link. Leave empty to hide it.",
			type: "email",
		}),
	],
	preview: {
		prepare: () => ({ title: "About page" }),
	},
});
