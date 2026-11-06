import type { APIRoute } from "astro";
import { postsFeed } from "@/lib/rss";

export const GET: APIRoute = ({ site }) => postsFeed("pl", site);
