import { describe, expect, it } from "vitest";
import {
	continentMeta,
	getLangFromUrl,
	localizePath,
	readingLine,
	tripLine,
	updatedLine,
} from "./ui";

describe("tripLine: trip vs. written dates on a post", () => {
	it("shows both months when the post was written in a later year", () => {
		expect(tripLine("pl", "2017-09-01", "2026-11-05T10:00:00Z")).toBe(
			"Podróż: wrzesień 2017. Opisana: listopad 2026.",
		);
	});

	it("drops the written month when trip and post share a year", () => {
		expect(tripLine("pl", "2026-05-01", "2026-11-05T10:00:00Z")).toBe(
			"Podróż: maj 2026.",
		);
	});

	it("counts the publish year in Warsaw time, not UTC", () => {
		// 23:30 UTC on 31 Dec is already 1 Jan in Poland → same year as the trip.
		expect(tripLine("pl", "2027-01-10", "2026-12-31T23:30:00Z")).toBe(
			"Podróż: styczeń 2027.",
		);
	});

	it("uses the Warsaw month for the written date", () => {
		// 23:30 UTC on 30 Nov is already December in Poland.
		expect(tripLine("pl", "2017-09-01", "2026-11-30T23:30:00Z")).toBe(
			"Podróż: wrzesień 2017. Opisana: grudzień 2026.",
		);
	});

	it("shows only the trip month when the post has no publish date", () => {
		expect(tripLine("pl", "2017-09-01", null)).toBe("Podróż: wrzesień 2017.");
	});

	it("is empty without a trip date", () => {
		expect(tripLine("pl", null, "2026-11-05T10:00:00Z")).toBeNull();
	});
});

describe("updatedLine: manual update note", () => {
	it("uses the Warsaw month for the update date", () => {
		// 23:30 UTC on 30 Nov is already December in Poland.
		expect(updatedLine("pl", "2026-11-30T23:30:00Z", null)).toBe(
			"Zaktualizowano: grudzień 2026.",
		);
	});

	it("ends the note with a period unless it already has punctuation", () => {
		expect(updatedLine("pl", "2026-06-15T10:00:00Z", "Nowe ceny biletów")).toBe(
			"Zaktualizowano: czerwiec 2026. Nowe ceny biletów.",
		);
		expect(updatedLine("pl", "2026-06-15T10:00:00Z", "Prom kursuje!")).toBe(
			"Zaktualizowano: czerwiec 2026. Prom kursuje!",
		);
	});

	it("is empty when the post has no manual update", () => {
		expect(updatedLine("pl", null, "ignored")).toBeNull();
	});
});

describe("Polish plural forms in meta lines", () => {
	it.each([
		[1, 1, "1 kraj · 1 historia"],
		[3, 4, "3 kraje · 4 historie"],
		[5, 12, "5 krajów · 12 historii"],
		[12, 22, "12 krajów · 22 historie"],
		[22, 25, "22 kraje · 25 historii"],
	])("continentMeta(pl, %i, %i) → %s", (countries, stories, expected) => {
		expect(continentMeta("pl", countries, stories)).toBe(expected);
	});

	it("uses English singular and plural", () => {
		expect(continentMeta("en", 1, 2)).toBe("1 country · 2 stories");
	});

	it.each([
		[1, "8 min czytania, 1 zdjęcie."],
		[24, "8 min czytania, 24 zdjęcia."],
		[48, "8 min czytania, 48 zdjęć."],
	])("readingLine with %i photos → %s", (photos, expected) => {
		expect(readingLine("pl", 8, photos)).toBe(expected);
	});

	it("readingLine is empty when both values are missing", () => {
		expect(readingLine("pl", null, null)).toBeNull();
	});
});

describe("language routing", () => {
	it("keeps Polish at the root and prefixes English with /en", () => {
		expect(localizePath("pl", "/najnowsze")).toBe("/najnowsze");
		expect(localizePath("en", "/latest")).toBe("/en/latest");
		expect(localizePath("en", "/")).toBe("/en/");
	});

	it("reads the language from the URL, defaulting to Polish", () => {
		expect(getLangFromUrl(new URL("https://x.pl/en/latest/"))).toBe("en");
		expect(getLangFromUrl(new URL("https://x.pl/islandia/wpis/"))).toBe("pl");
		expect(getLangFromUrl(new URL("https://x.pl/de/x/"))).toBe("pl");
		expect(getLangFromUrl(new URL("https://x.pl/constructor/"))).toBe("pl");
	});
});
