// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import { SANITY_DATASET, SANITY_PROJECT_ID } from "./src/sanity/env.ts";

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
	process.env.NODE_ENV ?? "development",
	process.cwd(),
	"",
);

// https://astro.build/config
export default defineConfig({
	site: "https://spoznionepodroze.pl",
	i18n: {
		defaultLocale: "pl",
		locales: ["pl", "en"],
	},
	integrations: [
		sitemap(),
		sanity({
			projectId: PUBLIC_SANITY_PROJECT_ID || SANITY_PROJECT_ID,
			dataset: PUBLIC_SANITY_DATASET || SANITY_DATASET,
			useCdn: false,
			apiVersion: "2026-07-01",
		}),
		react(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Bricolage Grotesque",
			cssVariable: "--font-bricolage",
			weights: [600, 700, 800],
			subsets: ["latin", "latin-ext"],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "Hanken Grotesk",
			cssVariable: "--font-hanken",
			weights: [400, 500, 600],
			subsets: ["latin", "latin-ext"],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "DM Mono",
			cssVariable: "--font-dm-mono",
			weights: [400, 500],
			subsets: ["latin", "latin-ext"],
			fallbacks: ["monospace"],
		},
	],
});
