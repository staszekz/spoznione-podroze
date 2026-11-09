import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { $activeContinent } from "@/stores/activeContinent";

// Vitest runs without globals, so Testing Library cannot unmount on its own.
// The store is module state shared by every test in a file: reset it too.
afterEach(() => {
	cleanup();
	$activeContinent.set(null);
});
