import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { postPath, routes, ui } from "@/i18n/ui";
import type { ContinentSummary, StoryCard } from "@/sanity/lib/queries";
import ContinentPills from "./ContinentPills";
import FeaturedStories from "./FeaturedStories";

function continent(
	_id: string,
	name: string,
	postCount: number,
): ContinentSummary {
	return {
		_id,
		name,
		slug: name.toLowerCase(),
		location: { lat: 0, lng: 0 },
		image: null,
		postCount,
	};
}

function story(
	_id: string,
	title: string,
	continentId: string,
	country: string,
): StoryCard {
	return {
		_id,
		title,
		slug: _id,
		excerpt: null,
		readingTime: 5,
		photoCount: null,
		tripDate: "2025-06-01",
		coverImage: null,
		country: { name: country, slug: country.toLowerCase(), continentId },
	};
}

const continents = [
	continent("europe", "Europa", 2),
	continent("asia", "Azja", 1),
	continent("africa", "Afryka", 0),
];
const stories = [
	story("rome", "Rzym nocą", "europe", "Wlochy"),
	story("lisbon", "Lizbona w deszczu", "europe", "Portugalia"),
	story("kyoto", "Kioto jesienią", "asia", "Japonia"),
];
const t = ui.pl;

// The homepage renders the pills and the stories as separate islands; they
// talk only through the $activeContinent store, which is what these tests cover.
function renderHomepage() {
	render(
		<>
			<ContinentPills continents={continents} defaultId="europe" />
			<FeaturedStories
				continents={continents}
				stories={stories}
				defaultId="europe"
				lang="pl"
			/>
		</>,
	);
	return userEvent.setup();
}

function heading() {
	return screen.getByRole("heading", { level: 2 });
}

/** The visually hidden region that announces a swap to screen readers. */
function liveRegion() {
	return document.querySelector('[aria-live="polite"]');
}

describe("picking a continent swaps the featured stories", () => {
	it("shows the default continent's stories before any pick", () => {
		renderHomepage();

		expect(heading()).toHaveTextContent(`Europa · ${t["featured.heading"]}`);
		expect(screen.getByRole("link", { name: /Rzym nocą/ })).toBeVisible();
		expect(
			screen.getByRole("link", { name: /Lizbona w deszczu/ }),
		).toBeVisible();
		expect(screen.queryByRole("link", { name: /Kioto/ })).toBeNull();
		expect(screen.getByRole("button", { name: "Europa" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		// Nothing is announced on load: the heading would be read twice.
		expect(liveRegion()).toBeEmptyDOMElement();
	});

	it("shows the picked continent's stories and announces the swap", async () => {
		const user = renderHomepage();

		await user.click(screen.getByRole("button", { name: "Azja" }));

		expect(heading()).toHaveTextContent(`Azja · ${t["featured.heading"]}`);
		expect(
			screen.getByRole("link", { name: /Kioto jesienią/ }),
		).toHaveAttribute("href", postPath("pl", "japonia", "kyoto"));
		expect(screen.queryByRole("link", { name: /Rzym nocą/ })).toBeNull();
		expect(screen.getByRole("button", { name: "Azja" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "Europa" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(liveRegion()).toHaveTextContent(`Azja · ${t["featured.heading"]}`);
	});

	it("explains an empty continent and links to the latest stories", async () => {
		const user = renderHomepage();

		await user.click(screen.getByRole("button", { name: "Afryka" }));

		expect(screen.getByText(t["featured.empty"])).toBeVisible();
		expect(
			screen.getByRole("link", { name: t["featured.emptyCta"] }),
		).toHaveAttribute("href", routes.pl.latest);
		// Afryka has no page of its own yet: "all countries" goes to the index.
		expect(
			screen.getByRole("link", {
				name: new RegExp(t["featured.allCountries"]),
			}),
		).toHaveAttribute("href", routes.pl.continents);
		expect(liveRegion()).toHaveTextContent(t["featured.empty"]);
	});
});
