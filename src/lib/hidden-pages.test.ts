import { describe, expect, it } from "vitest";
import { routes } from "@/i18n/ui";
import { inSitemap } from "./hidden-pages";

const SITE = "https://spoznionepodroze.pl";

describe("inSitemap: hidden collaboration page stays out of search", () => {
	it("leaves out the PL and EN collaboration pages while they are hidden", () => {
		// Built from the real routes, so renaming a page without updating the
		// filter fails here instead of putting the page back into the sitemap.
		for (const path of [routes.pl.collab, routes.en.collab]) {
			expect(inSitemap(`${SITE}${path}/`, false)).toBe(false);
			expect(inSitemap(`${SITE}${path}`, false)).toBe(false);
		}
	});

	it("keeps a post whose slug merely contains the word", () => {
		expect(inSitemap(`${SITE}/islandia/wspolpraca/`, false)).toBe(true);
		expect(inSitemap(`${SITE}/wspolpraca-z-marka/`, false)).toBe(true);
	});

	it("lists the collaboration pages again once COLLAB_PAGE_LIVE is on", () => {
		expect(inSitemap(`${SITE}/wspolpraca/`, true)).toBe(true);
	});
});
