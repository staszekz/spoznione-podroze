import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** URL-safe ASCII slug for heading anchors ("Dzień 2: Łódź" → "dzien-2-lodz"). */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ł/g, "l")
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
