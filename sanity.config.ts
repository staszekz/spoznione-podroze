import { documentInternationalization } from "@sanity/document-internationalization";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { ABOUT_PAGE_ID } from "./src/sanity/schemaTypes/aboutPage";

// Singletons: one fixed document, opened directly, never created or duplicated.
const SINGLETON_TYPES = new Set(["aboutPage"]);
const SINGLETON_ACTIONS = new Set(["publish", "discardChanges", "restore"]);

export const SUPPORTED_LANGUAGES = [
	{ id: "pl", title: "Polski" },
	{ id: "en", title: "English" },
];

export default defineConfig({
	name: "spoznione-podroze",
	title: "Spóźnione Podróże",
	projectId: "uk2139y1",
	dataset: "production",
	plugins: [
		structureTool({
			structure: (S) =>
				S.list()
					.title("Content")
					.items([
						S.listItem()
							.title("About page")
							.id(ABOUT_PAGE_ID)
							.child(
								S.document().schemaType("aboutPage").documentId(ABOUT_PAGE_ID),
							),
						S.divider(),
						...S.documentTypeListItems().filter(
							(item) => !SINGLETON_TYPES.has(item.getId() ?? ""),
						),
					]),
		}),
		documentInternationalization({
			supportedLanguages: SUPPORTED_LANGUAGES,
			schemaTypes: ["post"],
		}),
	],
	schema: {
		types: schemaTypes,
		templates: (templates) =>
			templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
	},
	document: {
		actions: (actions, { schemaType }) =>
			SINGLETON_TYPES.has(schemaType)
				? actions.filter(
						({ action }) => action && SINGLETON_ACTIONS.has(action),
					)
				: actions,
	},
});
