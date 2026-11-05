import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImage as SanityImageType } from "@/sanity/lib/queries";

/** Candidate srcset widths; capped per image at 2× its `width` (retina). */
const SRCSET_WIDTHS = [320, 480, 640, 960, 1280, 1600, 2048];

interface SanityImageProps {
	image: SanityImageType | null | undefined;
	/** Width of the fallback `src`; with `height` it sets the crop's aspect ratio. */
	width: number;
	height: number;
	/** Rendered width per breakpoint, so the browser picks the right srcset entry. */
	sizes: string;
	className?: string;
	loading?: "lazy" | "eager";
	fetchPriority?: "high" | "auto";
}

/** Renders a Sanity image, or the prototype's diagonal-stripe placeholder when missing. */
export default function SanityImage({
	image,
	width,
	height,
	sizes,
	className,
	loading = "lazy",
	fetchPriority = "auto",
}: SanityImageProps) {
	if (!image?.asset) {
		return (
			<div
				aria-hidden="true"
				className={cn("h-full w-full", className)}
				style={{
					background:
						"repeating-linear-gradient(45deg, var(--muted) 0px, var(--muted) 14px, var(--card) 14px, var(--card) 28px)",
				}}
			/>
		);
	}

	const src = (w: number) =>
		urlFor(image)
			.width(w)
			.height(Math.round((w * height) / width))
			.fit("crop")
			.url();
	const maxWidth = Math.min(width * 2, SRCSET_WIDTHS.at(-1) ?? width);
	const srcSet = SRCSET_WIDTHS.filter((w) => w <= maxWidth)
		.map((w) => `${src(w)} ${w}w`)
		.join(", ");
	const lqip = image.asset.metadata?.lqip;

	return (
		<img
			src={src(width)}
			srcSet={srcSet}
			sizes={sizes}
			alt={image.alt ?? ""}
			width={width}
			height={height}
			loading={loading}
			fetchPriority={fetchPriority}
			className={cn("h-full w-full object-cover", className)}
			// Blurred preview (Sanity LQIP) shows until the real image paints.
			style={
				lqip
					? {
							backgroundImage: `url(${lqip})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
						}
					: undefined
			}
		/>
	);
}
