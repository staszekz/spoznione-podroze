/** Fractions (0–1) cut off each edge in the Studio crop tool; unset = 0. */
export interface Crop {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
}

/**
 * Height that keeps the aspect ratio of what the author picked: the original
 * minus the Studio crop. Using the uncropped ratio made the image builder
 * crop a second time. Without dimensions, returns `fallback`.
 */
export function croppedHeight(
	width: number,
	dims: { width: number | null; height: number | null } | null | undefined,
	crop: Crop | null | undefined,
	fallback: number,
): number {
	if (!dims?.width || !dims.height) return fallback;
	const visibleWidth =
		dims.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0));
	const visibleHeight =
		dims.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0));
	return Math.round((width * visibleHeight) / visibleWidth);
}
