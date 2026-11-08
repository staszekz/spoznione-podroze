import { Minus, Plus } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/i18n/ui";
import { postPath, routes, ui } from "@/i18n/ui";
import { urlFor } from "@/sanity/lib/image";
import type {
	ContinentSummary,
	CountryPin,
	SanityImage,
} from "@/sanity/lib/queries";
import { $activeContinent } from "@/stores/activeContinent";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

// MapLibre 6 resolves its worker relative to its own module, but Vite bundles
// that module into a chunk and never emits the worker file (404, no tiles).
// `?url` makes Vite emit the worker as an asset and gives us its final URL.
maplibregl.setWorkerUrl(workerUrl);

// OpenFreeMap: free for commercial use, no key; CARTO needs an Enterprise licence.
const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/positron";
const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";
/** Below this zoom the map shows continent clusters, above it country pins. */
const COUNTRY_ZOOM = 3;

const PLACEHOLDER_BG =
	"repeating-linear-gradient(45deg, var(--muted) 0px, var(--muted) 14px, var(--card) 14px, var(--card) 28px)";

export interface MapViewProps {
	continents: ContinentSummary[];
	countries: CountryPin[];
	defaultId: string;
	lang: Lang;
}

function isDarkTheme() {
	return document.documentElement.classList.contains("dark");
}

function el(tag: string, className: string, text?: string): HTMLElement {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function thumbEl(
	image: SanityImage | null,
	width: number,
	height: number,
	className: string,
) {
	if (image?.asset) {
		const img = document.createElement("img");
		img.src = urlFor(image).width(width).height(height).fit("crop").url();
		img.alt = "";
		img.className = className;
		return img;
	}
	const placeholder = el("div", className);
	placeholder.style.background = PLACEHOLDER_BG;
	return placeholder;
}

/** Continent markers are real buttons, so Tab and Enter/Space reach them. */
function continentButton(className: string, continent: ContinentSummary) {
	const button = el("button", className) as HTMLButtonElement;
	button.type = "button";
	button.setAttribute("aria-label", continent.name);
	return button;
}

function activeContinentEl(continent: ContinentSummary): HTMLElement {
	const root = continentButton(
		"flex cursor-pointer flex-col items-center gap-[7px] rounded-2xl",
		continent,
	);
	root.setAttribute("aria-pressed", "true");
	const photoWrap = el("div", "relative size-[62px] md:size-[78px]");
	const circle = el(
		"div",
		"absolute inset-0 overflow-hidden rounded-full border-4 border-card shadow-[0_10px_24px_rgba(31,27,22,0.24)]",
	);
	circle.appendChild(
		thumbEl(continent.image, 156, 156, "h-full w-full object-cover"),
	);
	const badge = el(
		"div",
		"absolute -right-[7px] -top-[7px] flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-card bg-primary px-1.5 text-xs font-bold text-primary-foreground",
		String(continent.postCount),
	);
	photoWrap.append(circle, badge);
	const label = el(
		"div",
		"rounded-full bg-foreground px-3.5 py-[5px] text-[13px] font-semibold text-background",
		continent.name,
	);
	root.append(photoWrap, label);
	return root;
}

function pillEl(name: string, tag: "div" | "button" = "div"): HTMLElement {
	const pill = el(
		tag,
		"inline-flex cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card px-3.5 py-[7px] text-[13px] font-semibold text-card-foreground shadow-[0_4px_12px_rgba(31,27,22,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
	);
	pill.append(
		el("span", "size-[7px] rounded-full bg-primary"),
		document.createTextNode(name),
	);
	return pill;
}

function countryPopupEl(country: CountryPin, lang: Lang): HTMLElement {
	const root = el("div", "flex w-[190px] flex-col gap-1.5 p-1 font-sans");
	root.appendChild(
		thumbEl(country.image, 280, 160, "h-20 w-full rounded-lg object-cover"),
	);
	root.appendChild(
		el(
			"span",
			"font-mono text-[10px] uppercase tracking-[0.05em] text-primary",
			country.name,
		),
	);
	if (country.latestPost) {
		root.appendChild(
			el(
				"div",
				"font-display text-sm font-semibold leading-tight text-card-foreground",
				country.latestPost.title,
			),
		);
		const link = el(
			"a",
			"text-[13px] font-semibold text-primary",
			`${ui[lang]["map.read"]} →`,
		) as HTMLAnchorElement;
		link.href = postPath(lang, country.slug, country.latestPost.slug);
		root.appendChild(link);
	}
	return root;
}

/** The MapLibre map itself (~1 MB with the library); loaded lazily by HeroMap. */
export default function MapView({
	continents,
	countries,
	defaultId,
	lang,
}: MapViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const continentMarkersRef = useRef<maplibregl.Marker[]>([]);
	const [tilesFailed, setTilesFailed] = useState(false);

	useEffect(() => {
		if (!containerRef.current) return;

		const map = new maplibregl.Map({
			container: containerRef.current,
			style: isDarkTheme() ? DARK_STYLE : LIGHT_STYLE,
			bounds: [
				[-135, -52],
				[168, 70],
			],
			fitBoundsOptions: { padding: 24 },
			minZoom: 0.2,
			maxZoom: 8,
			attributionControl: { compact: true },
			// MapLibre's own UI strings default to English (canvas reads "Map, region").
			locale: {
				"Map.Title": ui[lang]["map.canvasLabel"],
				"AttributionControl.ToggleAttribution": ui[lang]["map.attribution"],
			},
		});
		mapRef.current = map;
		// The canvas fills an overflow-hidden box, so an outer ring would be clipped.
		map
			.getCanvas()
			.classList.add(
				"focus-visible:outline-2",
				"focus-visible:-outline-offset-2",
				"focus-visible:outline-ring",
			);

		// Rebuilding swaps the marker elements; keep keyboard focus on the
		// (new) active marker instead of letting it drop to <body>.
		const buildContinentMarkers = () => {
			const hadFocus = continentMarkersRef.current.some((marker) =>
				marker.getElement().contains(document.activeElement),
			);
			for (const marker of continentMarkersRef.current) marker.remove();
			continentMarkersRef.current = continents.map((continent) => {
				const active = ($activeContinent.get() ?? defaultId) === continent._id;
				let element: HTMLElement;
				if (active) {
					element = activeContinentEl(continent);
				} else {
					element = pillEl(continent.name, "button");
					(element as HTMLButtonElement).type = "button";
					element.setAttribute("aria-pressed", "false");
				}
				element.addEventListener("click", () => {
					$activeContinent.set(continent._id);
					map.flyTo({
						center: [continent.location.lng, continent.location.lat],
						zoom: 3.2,
						duration: 1400,
					});
				});
				return new maplibregl.Marker({
					element,
					anchor: active ? "bottom" : "center",
				})
					.setLngLat([continent.location.lng, continent.location.lat])
					.addTo(map);
			});
			if (hadFocus) {
				continentMarkersRef.current
					.find((marker) => marker.getElement().ariaPressed === "true")
					?.getElement()
					.focus();
			}
		};

		const countryMarkers = countries.map((country) => {
			// A <div>, not a <button>: MapLibre toggles the popup on Enter/Space
			// itself, and a button's synthetic click would toggle it a second time
			// (map click handler), closing it at once. So: role + expanded state.
			const element = pillEl(country.name);
			element.setAttribute("role", "button");
			element.setAttribute("aria-expanded", "false");
			// The opened popup moves focus to its link before this keypress ends;
			// its default action would then follow that link (Enter) or scroll the
			// page (Space).
			element.addEventListener("keypress", (event) => {
				if (event.code === "Enter" || event.code === "Space") {
					event.preventDefault();
				}
			});
			const content = countryPopupEl(country, lang);
			const popup = new maplibregl.Popup({
				offset: 14,
				closeButton: false,
				maxWidth: "220px",
			}).setDOMContent(content);
			// Focus lands on the popup link; MapLibre has no Escape to leave it.
			content.addEventListener("keydown", (event) => {
				if (event.key !== "Escape") return;
				popup.remove();
				element.focus();
			});
			popup.on("open", () => element.setAttribute("aria-expanded", "true"));
			popup.on("close", () => element.setAttribute("aria-expanded", "false"));
			// setPopup after addTo: addTo() calls remove(), which drops the
			// Enter/Space listener setPopup() attached (MapLibre 6.16).
			return new maplibregl.Marker({ element, anchor: "center" })
				.setLngLat([country.location.lng, country.location.lat])
				.addTo(map)
				.setPopup(popup);
		});

		// Markers stay mounted and are only hidden: re-adding them on every zoom
		// event closed an open country popup.
		const syncZoomLevel = () => {
			const showCountries = map.getZoom() >= COUNTRY_ZOOM;
			// Hiding a focused marker or popup (continents when zooming in, countries
			// and their popups when zooming out) would drop focus to <body>. The
			// canvas stays visible and pans/zooms with the keyboard.
			const hiding = showCountries
				? continentMarkersRef.current.map((marker) => marker.getElement())
				: countryMarkers.flatMap((marker) => [
						marker.getElement(),
						marker.getPopup()?.getElement(),
					]);
			if (hiding.some((node) => node?.contains(document.activeElement))) {
				map.getCanvas().focus();
			}
			for (const marker of continentMarkersRef.current) {
				marker.getElement().style.display = showCountries ? "none" : "";
			}
			for (const marker of countryMarkers) {
				marker.getElement().style.display = showCountries ? "" : "none";
				if (!showCountries) marker.getPopup()?.remove();
			}
		};

		// Until one basemap tile has loaded, any error (style, TileJSON, tiles)
		// means a blank canvas, e.g. OpenFreeMap down: say so. `load` is no proof,
		// because it also fires when every tile errored. Once a tile loads, the
		// message clears, and later single-tile errors are ignored.
		let tileLoaded = false;
		map.on("sourcedata", (event) => {
			if (!event.tile || tileLoaded) return;
			tileLoaded = true;
			setTilesFailed(false);
		});
		map.on("error", () => {
			if (!tileLoaded) setTilesFailed(true);
		});

		buildContinentMarkers();
		syncZoomLevel();
		map.on("zoom", syncZoomLevel);

		const unsubscribe = $activeContinent.subscribe(() => {
			buildContinentMarkers();
			syncZoomLevel();
		});

		const onThemeChange = () => {
			map.setStyle(isDarkTheme() ? DARK_STYLE : LIGHT_STYLE);
		};
		window.addEventListener("themechange", onThemeChange);

		return () => {
			window.removeEventListener("themechange", onThemeChange);
			unsubscribe();
			map.remove();
			mapRef.current = null;
		};
	}, [continents, countries, defaultId, lang]);

	return (
		<div className="relative h-full w-full">
			<div ref={containerRef} className="h-full w-full" />
			{tilesFailed && (
				<div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
					<div className="pointer-events-auto flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-3 text-center shadow-[0_4px_14px_rgba(31,27,22,0.07)]">
						<p role="alert" className="text-sm text-muted-foreground">
							{ui[lang]["map.tilesError"]}
						</p>
						<a
							href={routes[lang].continents}
							className="text-sm font-semibold text-primary-dark hover:text-foreground dark:text-primary"
						>
							{ui[lang]["map.tilesErrorCta"]} <span aria-hidden="true">→</span>
						</a>
					</div>
				</div>
			)}
			<div className="absolute right-3.5 top-3.5 z-10 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_14px_rgba(31,27,22,0.07)]">
				<button
					type="button"
					aria-label={ui[lang]["map.zoomIn"]}
					onClick={() => mapRef.current?.zoomIn()}
					className="flex size-9 cursor-pointer items-center justify-center border-b border-border text-card-foreground hover:bg-muted"
				>
					<Plus className="size-4" />
				</button>
				<button
					type="button"
					aria-label={ui[lang]["map.zoomOut"]}
					onClick={() => mapRef.current?.zoomOut()}
					className="flex size-9 cursor-pointer items-center justify-center text-card-foreground hover:bg-muted"
				>
					<Minus className="size-4" />
				</button>
			</div>
		</div>
	);
}
