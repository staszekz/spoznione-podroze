import { Minus, Plus } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { Lang } from "@/i18n/ui";
import { postPath, ui } from "@/i18n/ui";
import { urlFor } from "@/sanity/lib/image";
import type {
	ContinentSummary,
	CountryPin,
	SanityImage,
} from "@/sanity/lib/queries";
import { $activeContinent } from "@/stores/activeContinent";
import "maplibre-gl/dist/maplibre-gl.css";

const LIGHT_STYLE =
	"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE =
	"https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
/** Below this zoom the map shows continent clusters, above it country pins. */
const COUNTRY_ZOOM = 3;

const PLACEHOLDER_BG =
	"repeating-linear-gradient(45deg, var(--muted) 0px, var(--muted) 14px, var(--card) 14px, var(--card) 28px)";

interface HeroMapProps {
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

function activeContinentEl(continent: ContinentSummary): HTMLElement {
	const root = el("div", "flex cursor-pointer flex-col items-center gap-[7px]");
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

function pillEl(name: string): HTMLElement {
	const pill = el(
		"div",
		"inline-flex cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card px-3.5 py-[7px] text-[13px] font-semibold text-card-foreground shadow-[0_4px_12px_rgba(31,27,22,0.08)]",
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

export default function HeroMap({
	continents,
	countries,
	defaultId,
	lang,
}: HeroMapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const continentMarkersRef = useRef<maplibregl.Marker[]>([]);

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
		});
		mapRef.current = map;

		const buildContinentMarkers = () => {
			for (const marker of continentMarkersRef.current) marker.remove();
			continentMarkersRef.current = continents.map((continent) => {
				const active = ($activeContinent.get() ?? defaultId) === continent._id;
				const element = active
					? activeContinentEl(continent)
					: pillEl(continent.name);
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
		};

		const countryMarkers = countries.map((country) => {
			const popup = new maplibregl.Popup({
				offset: 14,
				closeButton: false,
				maxWidth: "220px",
			}).setDOMContent(countryPopupEl(country, lang));
			return new maplibregl.Marker({
				element: pillEl(country.name),
				anchor: "center",
			})
				.setLngLat([country.location.lng, country.location.lat])
				.setPopup(popup);
		});

		const syncZoomLevel = () => {
			const showCountries = map.getZoom() >= COUNTRY_ZOOM;
			for (const marker of continentMarkersRef.current) {
				marker.getElement().style.display = showCountries ? "none" : "";
			}
			for (const marker of countryMarkers) {
				if (showCountries) marker.addTo(map);
				else marker.remove();
			}
		};

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
			<div className="absolute right-3.5 top-3.5 z-10 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_14px_rgba(31,27,22,0.07)]">
				<button
					type="button"
					aria-label="+"
					onClick={() => mapRef.current?.zoomIn()}
					className="flex size-9 cursor-pointer items-center justify-center border-b border-border text-card-foreground hover:bg-muted"
				>
					<Plus className="size-4" />
				</button>
				<button
					type="button"
					aria-label="−"
					onClick={() => mapRef.current?.zoomOut()}
					className="flex size-9 cursor-pointer items-center justify-center text-card-foreground hover:bg-muted"
				>
					<Minus className="size-4" />
				</button>
			</div>
		</div>
	);
}
