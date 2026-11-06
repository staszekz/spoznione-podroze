import type { SanityImageSource } from "@sanity/image-url";
import { createImageUrlBuilder } from "@sanity/image-url";

// Built from the project config, not from `sanityClient`: React islands import
// this file, and the client (with stega) would otherwise ship to the browser.
const builder = createImageUrlBuilder({
	projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
	dataset: import.meta.env.PUBLIC_SANITY_DATASET,
});

export function urlFor(source: SanityImageSource) {
	return builder.image(source).auto("format");
}

/** 1200×630 JPEG for og:image — share crawlers don't negotiate AVIF/WebP. */
export function ogImageUrl(source: SanityImageSource): string {
	return builder
		.image(source)
		.width(1200)
		.height(630)
		.fit("crop")
		.format("jpg")
		.url();
}
