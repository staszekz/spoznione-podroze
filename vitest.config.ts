/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig applies the Astro project's Vite setup (e.g. the `@/` alias).
export default getViteConfig({
	test: {
		include: ["src/**/*.test.ts"],
	},
});
