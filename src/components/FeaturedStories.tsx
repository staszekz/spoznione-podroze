import { useStore } from "@nanostores/react";
import SanityImage from "@/components/SanityImage";
import type { Lang } from "@/i18n/ui";
import {
	continentPath,
	postMeta,
	postPath,
	routes,
	tripYear,
	ui,
} from "@/i18n/ui";
import type { ContinentSummary, StoryCard } from "@/sanity/lib/queries";
import { $activeContinent } from "@/stores/activeContinent";

interface FeaturedStoriesProps {
	continents: ContinentSummary[];
	stories: StoryCard[];
	defaultId: string;
	lang: Lang;
}

function StoryMeta({ story, lang }: { story: StoryCard; lang: Lang }) {
	const meta = postMeta(lang, story.readingTime, story.photoCount);
	if (!meta) return null;
	return (
		<span className="font-mono text-[11.5px] text-subtle-foreground">
			{meta}
		</span>
	);
}

export default function FeaturedStories({
	continents,
	stories,
	defaultId,
	lang,
}: FeaturedStoriesProps) {
	const picked = useStore($activeContinent);
	const selected = picked ?? defaultId;
	const continent = continents.find((c) => c._id === selected);
	const filtered = stories
		.filter((s) => s.country?.continentId === selected)
		.slice(0, 3);
	const [main, ...side] = filtered;
	// Continents without posts have no page of their own — fall back to the index.
	const allHref =
		continent?.slug && filtered.length > 0
			? continentPath(lang, continent.slug)
			: routes[lang].continents;

	return (
		<section className="flex flex-col gap-4 py-6 md:gap-[18px] md:py-7">
			{/* Picking a continent on the map or the pills swaps this list in place;
			    a screen reader hears nothing unless a live region says so. Empty
			    until the first pick, so the heading is not read twice on load. */}
			<p className="sr-only" aria-live="polite">
				{picked &&
					`${continent?.name} · ${ui[lang]["featured.heading"]}${
						filtered.length === 0 ? `. ${ui[lang]["featured.empty"]}` : ""
					}`}
			</p>
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-display text-[21px] font-bold tracking-[-0.01em] md:text-[26px]">
					{continent?.name} · {ui[lang]["featured.heading"]}
				</h2>
				<a
					href={allHref}
					className="-my-1.5 whitespace-nowrap py-1.5 text-[13px] font-semibold text-primary hover:text-primary-dark dark:hover:text-foreground md:text-[15px]"
				>
					{ui[lang]["featured.allCountries"]} →
				</a>
			</div>

			{filtered.length === 0 && (
				<div className="flex flex-col items-start gap-2 rounded-[18px] border border-border bg-card p-6 md:p-8">
					<p className="text-muted-foreground">{ui[lang]["featured.empty"]}</p>
					<a
						href={routes[lang].latest}
						className="font-semibold text-primary-dark hover:text-foreground dark:text-primary"
					>
						{ui[lang]["featured.emptyCta"]} <span aria-hidden="true">→</span>
					</a>
				</div>
			)}

			<div className="grid gap-4 md:gap-6 lg:grid-cols-[1.5fr_1fr]">
				{main?.country && (
					<a
						href={postPath(lang, main.country.slug, main.slug)}
						className="group relative block h-[300px] overflow-hidden rounded-[18px] md:h-[440px] md:rounded-[20px]"
					>
						<SanityImage
							image={main.coverImage}
							width={880}
							height={440}
							// Fixed-height card + object-cover: the 2:1 photo is drawn at
							// 2× the card height (880px from md, 600px below) unless the
							// card is wider, so sizes follows that, not the card width.
							sizes="(min-width: 768px) 880px, (min-width: 640px) calc(100vw - 40px), 600px"
							loading="eager"
							fetchPriority="high"
							className="transition-transform duration-500 group-hover:scale-[1.03]"
						/>
						{/* The scrim wraps the text, so it grows with a long title or zoom:
						    ≥ 75% under every line (≥ 4.5:1 even on a white photo, LAN-164),
						    fading out only in the top padding. */}
						<div
							className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 px-[18px] pt-24 pb-[18px] md:px-7 md:pb-7"
							style={{
								background:
									"linear-gradient(to top, color-mix(in srgb, var(--scrim) 85%, transparent), color-mix(in srgb, var(--scrim) 75%, transparent) calc(100% - 6rem), transparent)",
							}}
						>
							<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-on-image-eyebrow md:text-[11px]">
								{[main.country.name, continent?.name, tripYear(main.tripDate)]
									.filter(Boolean)
									.join(" · ")}
							</span>
							<span className="font-display text-[25px] font-bold leading-[1.08] tracking-[-0.02em] text-on-image md:text-4xl md:leading-[1.06]">
								{main.title}
							</span>
							{main.excerpt && (
								<p className="hidden max-w-[440px] text-[15px] leading-normal text-on-image/90 md:block">
									{main.excerpt}
								</p>
							)}
						</div>
					</a>
				)}

				<div className="flex flex-col gap-4 md:gap-6">
					{side.map(
						(story) =>
							story.country && (
								<a
									key={story._id}
									href={postPath(lang, story.country.slug, story.slug)}
									className="flex flex-1 gap-3 rounded-[14px] border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(31,27,22,0.1)] md:gap-4 md:rounded-2xl md:p-3.5"
								>
									<div className="relative size-[92px] flex-none overflow-hidden rounded-[10px] md:h-auto md:w-[120px] md:rounded-xl">
										<SanityImage
											image={story.coverImage}
											width={240}
											height={240}
											sizes="(min-width: 768px) 120px, 92px"
										/>
									</div>
									<div className="flex flex-col gap-1 self-center md:gap-1.5">
										<span className="font-mono text-[10px] uppercase tracking-[0.05em] text-primary md:text-[10.5px]">
											{story.country.name}
											{tripYear(story.tripDate) &&
												` · ${tripYear(story.tripDate)}`}
										</span>
										<span className="font-display text-base font-semibold leading-[1.2] md:text-[19px] md:leading-[1.16]">
											{story.title}
										</span>
										<StoryMeta story={story} lang={lang} />
									</div>
								</a>
							),
					)}
				</div>
			</div>
		</section>
	);
}
