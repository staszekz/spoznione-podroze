/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig applies the Astro project's Vite setup (e.g. the `@/` alias).
export default getViteConfig({
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
				},
			},
			// React islands working together in a DOM, without a browser or the CMS.
			{
				extends: true,
				test: {
					name: "integration",
					include: ["src/**/*.test.tsx"],
					environment: "jsdom",
					setupFiles: ["src/test/setup-dom.ts"],
				},
			},
		],
	},
});
