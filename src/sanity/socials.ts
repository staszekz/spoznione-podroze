// Plain module (no `sanity` import): shared by the Studio schema and the site.
export const SOCIAL_PLATFORMS = [
	{ title: "Instagram", value: "instagram" },
	{ title: "Facebook", value: "facebook" },
	{ title: "YouTube", value: "youtube" },
	{ title: "TikTok", value: "tiktok" },
	{ title: "Threads", value: "threads" },
	{ title: "X", value: "x" },
];

export function socialLabel(platform: string): string {
	return SOCIAL_PLATFORMS.find((p) => p.value === platform)?.title ?? platform;
}
