import { describe, expect, it } from "vitest";
import { isSafeHref } from "./safe-href";

describe("isSafeHref: which CMS links may become <a href>", () => {
	it.each([
		"https://example.com/trip",
		"http://example.com",
		"mailto:kontakt@spoznionepodroze.pl",
		"tel:+48123456789",
		"/o-mnie",
		"#spis-tresci",
	])("allows web, mail, phone and relative links: %s", (href) => {
		expect(isSafeHref(href)).toBe(true);
	});

	it.each([
		"javascript:alert(1)",
		"JavaScript:alert(1)",
		" javascript:alert(1)",
		"java\tscript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:msgbox(1)",
	])(
		"blocks script and data URLs in any spelling a browser accepts: %j",
		(href) => {
			expect(isSafeHref(href)).toBe(false);
		},
	);

	it("blocks hrefs that are not valid URLs", () => {
		expect(isSafeHref("http://")).toBe(false);
	});

	it("blocks an empty href, which would link to the current page", () => {
		expect(isSafeHref("")).toBe(false);
		expect(isSafeHref("   ")).toBe(false);
	});
});
