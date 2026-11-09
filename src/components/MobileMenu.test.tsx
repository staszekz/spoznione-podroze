import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { routes, ui } from "@/i18n/ui";
import MobileMenu from "./MobileMenu";

const t = ui.pl;
const items = [
	{ href: routes.pl.continents, label: t["nav.continents"] },
	{ href: routes.pl.latest, label: t["nav.latest"] },
];

function renderMenu() {
	render(
		<MobileMenu
			items={items}
			openLabel={t["menu.open"]}
			closeLabel={t["menu.close"]}
		/>,
	);
	return userEvent.setup();
}

describe("mobile menu", () => {
	it("opens and closes the navigation from its toggle", async () => {
		const user = renderMenu();
		const toggle = screen.getByRole("button", { name: t["menu.open"] });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("navigation")).toBeNull();

		await user.click(toggle);

		// Same button, now named for what it does next.
		expect(toggle).toHaveAccessibleName(t["menu.close"]);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("link", { name: t["nav.latest"] })).toHaveAttribute(
			"href",
			routes.pl.latest,
		);

		await user.click(toggle);

		expect(toggle).toHaveAccessibleName(t["menu.open"]);
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("navigation")).toBeNull();
	});

	it("closes on Escape and returns focus to the toggle", async () => {
		const user = renderMenu();

		await user.tab();
		await user.keyboard("{Enter}");
		await user.tab();
		expect(
			screen.getByRole("link", { name: t["nav.continents"] }),
		).toHaveFocus();

		await user.keyboard("{Escape}");

		const toggle = screen.getByRole("button", { name: t["menu.open"] });
		expect(screen.queryByRole("navigation")).toBeNull();
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		// Keyboard users stay where they were instead of landing on <body>.
		expect(toggle).toHaveFocus();
	});
});
