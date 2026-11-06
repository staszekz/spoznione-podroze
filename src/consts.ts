export const SITE_TITLE = "Spóźnione Podróże";
export const SITE_DESCRIPTION = {
	pl: "Lepiej późno niż wcale: blog podróżniczy o marzeniu, które długo czekało na swoją kolej. Nowe wyprawy i podróże z ostatnich lat.",
	en: "Better late than never: a travel blog about a dream that waited its turn. New trips and journeys from the past decade.",
} as const;
/** Shown to search engines as the post author (JSON-LD). */
export const AUTHOR_NAME = "Staszek";

/**
 * Data controller named in the privacy policy (GDPR art. 13).
 * TODO(LAN-125): replace the placeholders before launch.
 */
export const PRIVACY_CONTROLLER = {
	name: "[IMIĘ I NAZWISKO]",
	email: "[EMAIL]",
} as const;
