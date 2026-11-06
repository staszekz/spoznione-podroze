// Public identifiers, not secrets: they ship in every image URL and in the
// Studio config. Defaults keep builds working where no env vars are set —
// Cloudflare creates a fresh build trigger per PR branch without them.
// PUBLIC_SANITY_* env vars still override (e.g. a staging dataset).
export const SANITY_PROJECT_ID = "uk2139y1";
export const SANITY_DATASET = "production";
