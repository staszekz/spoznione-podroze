import { describe, expect, it } from "vitest";
import { croppedHeight } from "./crop";

describe("croppedHeight: inline images keep the ratio picked in Studio", () => {
	it("uses the cropped area, so the image builder does not crop a second time", () => {
		// 2000×1000 with 10% off top and bottom → visible 2000×800 (2.5:1).
		const crop = { top: 0.1, bottom: 0.1, left: 0, right: 0 };
		expect(croppedHeight(1440, { width: 2000, height: 1000 }, crop, 960)).toBe(
			576,
		);
	});

	it("accounts for side crops too", () => {
		// 3000×2000 with a quarter off each side → visible 1500×2000.
		const crop = { top: 0, bottom: 0, left: 0.25, right: 0.25 };
		expect(croppedHeight(1500, { width: 3000, height: 2000 }, crop, 960)).toBe(
			2000,
		);
	});

	it("subtracts top and bottom separately", () => {
		// 1000×1000 with 10% off the top and 30% off the bottom → visible 1000×600.
		const crop = { top: 0.1, bottom: 0.3, left: 0, right: 0 };
		expect(croppedHeight(1000, { width: 1000, height: 1000 }, crop, 960)).toBe(
			600,
		);
	});

	it("keeps the original ratio when the image is not cropped", () => {
		expect(croppedHeight(1440, { width: 2000, height: 1000 }, null, 960)).toBe(
			720,
		);
	});

	it("falls back when Sanity sent no dimensions", () => {
		expect(croppedHeight(1440, undefined, null, 960)).toBe(960);
	});
});
