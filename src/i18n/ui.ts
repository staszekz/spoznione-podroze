export const languages = {
	pl: "Polski",
	en: "English",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "pl";

export const ui = {
	pl: {
		"nav.continents": "Kontynenty",
		"nav.latest": "Najnowsze",
		"nav.about": "O mnie",
		"nav.collab": "Współpraca",
		"hero.eyebrow": "BLOG PODRÓŻNICZY · LEPIEJ PÓŹNO NIŻ WCALE",
		"hero.title": "Spóźnieni, ale już w drodze",
		"hero.lead":
			"Marzenie o podróżach i blogu długo czekało na swoją kolej. Teraz jest: nowe wyprawy i podróże z ostatnich lat. Wybierz kontynent na mapie.",
		"hero.ctaMap": "Odkrywaj mapę",
		"hero.ctaLatest": "Najnowsze wpisy",
		"featured.heading": "wybrane historie",
		"featured.allCountries": "Wszystkie kraje",
		"featured.readingMeta": "min",
		"post.trip": "Podróż",
		"post.written": "Opisana",
		"post.updated": "Zaktualizowano",
		"post.readingTime": "min czytania",
		"post.toc": "Spis treści",
		"post.gallery": "Galeria",
		"post.related": "Więcej historii z tego kraju",
		"post.authorText":
			"Długo odkładałem podróże i pisanie o nich. Teraz nadrabiam: opisuję nowe wyprawy i te z ostatnich lat.",
		"post.authorLink": "Więcej o mnie",
		"latest.title": "Najnowsze",
		"latest.lead": "Wszystkie historie po kolei — od najnowszej.",
		"latest.empty": "Nie ma jeszcze żadnych wpisów.",
		"collab.eyebrow": "O MNIE · WSPÓŁPRACA",
		"collab.title": "Poznajmy się — albo zróbmy coś razem",
		"collab.lead": "Marki, wydawcy, kompani w drodze — chętnie porozmawiam.",
		"collab.ctaAbout": "O mnie",
		"collab.ctaCollab": "Współpraca",
		"footer.meta": "Instagram · Newsletter · © 2026 · PL / EN",
		"footer.ai": "dla agentów AI: /llms.txt",
		"map.hint": "przesuń i przybliż",
		"map.read": "Czytaj",
		"map.label": "Mapa podróży",
		"map.show": "Pokaż mapę",
		"map.loading": "Ładuję mapę…",
		"map.error": "Nie udało się wczytać mapy.",
		"map.retry": "Odśwież",
		"theme.toggle": "Przełącz motyw",
		"menu.open": "Otwórz menu",
		"menu.close": "Zamknij menu",
		"stub.wip": "Ta strona jest w budowie — wróć wkrótce.",
		"notFound.title": "Nie znaleziono strony",
		"notFound.lead": "Ta strona nie istnieje albo została przeniesiona.",
		"notFound.cta": "Wróć na stronę główną",
	},
	en: {
		"nav.continents": "Continents",
		"nav.latest": "Latest",
		"nav.about": "About",
		"nav.collab": "Work with me",
		"hero.eyebrow": "TRAVEL BLOG · BETTER LATE THAN NEVER",
		"hero.title": "Late, but finally on the road",
		"hero.lead":
			"The dream of travelling and blogging waited its turn. Now it's here: new trips and journeys from the past decade. Pick a continent on the map.",
		"hero.ctaMap": "Explore the map",
		"hero.ctaLatest": "Latest posts",
		"featured.heading": "selected stories",
		"featured.allCountries": "All countries",
		"featured.readingMeta": "min",
		"post.trip": "Trip",
		"post.written": "Written",
		"post.updated": "Updated",
		"post.readingTime": "min read",
		"post.toc": "Contents",
		"post.gallery": "Gallery",
		"post.related": "More stories from this country",
		"post.authorText":
			"I put off travelling and writing about it for years. Now I'm catching up: new trips and ones from the past decade.",
		"post.authorLink": "More about me",
		"latest.title": "Latest",
		"latest.lead": "Every story in order — newest first.",
		"latest.empty": "No posts yet.",
		"collab.eyebrow": "ABOUT · COLLABORATION",
		"collab.title": "Let's meet — or make something together",
		"collab.lead": "Brands, publishers, road companions — happy to talk.",
		"collab.ctaAbout": "About me",
		"collab.ctaCollab": "Work with me",
		"footer.meta": "Instagram · Newsletter · © 2026 · PL / EN",
		"footer.ai": "for AI agents: /llms.txt",
		"map.hint": "pan and zoom",
		"map.read": "Read",
		"map.label": "Travel map",
		"map.show": "Show the map",
		"map.loading": "Loading the map…",
		"map.error": "The map didn't load.",
		"map.retry": "Reload",
		"theme.toggle": "Toggle theme",
		"menu.open": "Open menu",
		"menu.close": "Close menu",
		"stub.wip": "This page is under construction — check back soon.",
		"notFound.title": "Page not found",
		"notFound.lead": "This page doesn't exist or has been moved.",
		"notFound.cta": "Back to the homepage",
	},
} as const;

export type UiKey = keyof (typeof ui)["pl"];

export function getLangFromUrl(url: URL): Lang {
	const [, lang] = url.pathname.split("/");
	if (lang && lang in ui) return lang as Lang;
	return defaultLang;
}

export function getTranslations(lang: Lang) {
	return function t(key: UiKey): string {
		return ui[lang][key] ?? ui[defaultLang][key];
	};
}

/** Prefixes a root-relative path with the language segment (PL lives at `/`). */
export function localizePath(lang: Lang, path: string): string {
	const clean = path.startsWith("/") ? path : `/${path}`;
	return lang === defaultLang ? clean : `/${lang}${clean}`;
}

export const routes = {
	pl: {
		home: "/",
		continents: "/kontynenty",
		latest: "/najnowsze",
		about: "/o-mnie",
		collab: "/wspolpraca",
	},
	en: {
		home: "/en/",
		continents: "/en/continents",
		latest: "/en/latest",
		about: "/en/about",
		collab: "/en/work-with-me",
	},
} as const;

/** Builds the "☕ 5 min · 12 photos" post meta line; empty string when both are missing. */
export function postMeta(
	lang: Lang,
	readingTime: number | null | undefined,
	photoCount: number | null | undefined,
): string {
	return [
		readingTime
			? `☕ ${readingTime} ${ui[lang]["featured.readingMeta"]}`
			: null,
		photoCount ? photosText(lang, photoCount) : null,
	]
		.filter(Boolean)
		.join(" · ");
}

/** Builds the URL of a post page: `/{countrySlug}/{postSlug}` (EN under `/en/`). */
export function postPath(
	lang: Lang,
	countrySlug: string,
	postSlug: string,
): string {
	return localizePath(lang, `/${countrySlug}/${postSlug}`);
}

/** Year of a `YYYY-MM-DD` trip date, for card eyebrows; null when missing. */
export function tripYear(tripDate: string | null | undefined): string | null {
	return tripDate ? tripDate.slice(0, 4) : null;
}

// `date` fields are plain calendar days → format in UTC so no timezone shifts
// the month. `datetime` fields are instants → show the author's local month.
function formatMonthYear(lang: Lang, value: string, timeZone: string): string {
	return new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-US", {
		month: "long",
		year: "numeric",
		timeZone,
	}).format(new Date(value));
}

const AUTHOR_TZ = "Europe/Warsaw";

/**
 * "Podróż: wrzesień 2017. Opisana: listopad 2026." — the publish month is
 * dropped when the trip and the post share a year. Null without a trip date.
 */
export function tripLine(
	lang: Lang,
	tripDate: string | null | undefined,
	publishedAt: string | null | undefined,
): string | null {
	if (!tripDate) return null;
	const trip = `${ui[lang]["post.trip"]}: ${formatMonthYear(lang, tripDate, "UTC")}.`;
	if (!publishedAt) return trip;
	const publishedYear = new Intl.DateTimeFormat("en", {
		year: "numeric",
		timeZone: AUTHOR_TZ,
	}).format(new Date(publishedAt));
	if (publishedYear === tripYear(tripDate)) return trip;
	return `${trip} ${ui[lang]["post.written"]}: ${formatMonthYear(lang, publishedAt, AUTHOR_TZ)}.`;
}

/** "Zaktualizowano: listopad 2027. {note}" — null when the post has no manual update date. */
export function updatedLine(
	lang: Lang,
	updatedAt: string | null | undefined,
	updateNote: string | null | undefined,
): string | null {
	if (!updatedAt) return null;
	const line = `${ui[lang]["post.updated"]}: ${formatMonthYear(lang, updatedAt, AUTHOR_TZ)}.`;
	const note = updateNote?.trim();
	if (!note) return line;
	return `${line} ${/[.!?…]$/.test(note) ? note : `${note}.`}`;
}

const photoWords: Record<Lang, Partial<Record<Intl.LDMLPluralRule, string>>> = {
	pl: { one: "zdjęcie", few: "zdjęcia", many: "zdjęć", other: "zdjęcia" },
	en: { one: "photo", other: "photos" },
};

/** "1 zdjęcie", "24 zdjęcia", "48 zdjęć" — Polish has three plural forms. */
function photosText(lang: Lang, count: number): string {
	const rule = new Intl.PluralRules(lang).select(count);
	return `${count} ${photoWords[lang][rule] ?? photoWords[lang].other}`;
}

/** "8 min czytania, 24 zdjęcia." — plain-sentence post meta with plural forms; null when both are missing. */
export function readingLine(
	lang: Lang,
	readingTime: number | null | undefined,
	photoCount: number | null | undefined,
): string | null {
	const parts: string[] = [];
	if (readingTime) parts.push(`${readingTime} ${ui[lang]["post.readingTime"]}`);
	if (photoCount) parts.push(photosText(lang, photoCount));
	return parts.length ? `${parts.join(", ")}.` : null;
}
