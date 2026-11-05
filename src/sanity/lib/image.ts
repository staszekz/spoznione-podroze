import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Built from the project config, not from `sanityClient`: React islands import
// this file, and the client (with stega) would otherwise ship to the browser.
const builder = createImageUrlBuilder({
	projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
	dataset: import.meta.env.PUBLIC_SANITY_DATASET,
});

export function urlFor(source: SanityImageSource) {
	return builder.image(source).auto("format");
}
