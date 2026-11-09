import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
	api: {
		projectId: "uk2139y1",
		dataset: "production",
	},
	studioHost: "spoznione-podroze",
	deployment: {
		appId: "blg1zxmw2zc85mbfe5yxtsor",
	},
	// `pnpm typegen`: schema.json (from `sanity schema extract`) + the defineQuery
	// queries under src/ → src/sanity/sanity.types.ts. Both outputs are committed.
	typegen: {
		path: "./src/**/*.{ts,tsx}",
		schema: "schema.json",
		generates: "./src/sanity/sanity.types.ts",
	},
});
