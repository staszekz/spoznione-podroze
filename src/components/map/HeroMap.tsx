import {
	Component,
	lazy,
	type ReactNode,
	Suspense,
	useEffect,
	useRef,
	useState,
} from "react";
import { ui } from "@/i18n/ui";
import type { MapViewProps } from "./MapView";

// MapLibre is ~1 MB of JS plus WebGL setup, and the map sits in the first
// viewport on every device — so "load when visible" would load it at once.
// Instead it loads on the user's first pointer/touch/scroll interaction or on
// the button. No `keydown`: the first Tab would unmount the button before focus
// reaches it — keyboard users start the map with the button.
const MapView = lazy(() => import("./MapView"));

const START_EVENTS = [
	"pointerdown",
	"pointermove",
	"touchstart",
	"wheel",
	"scroll",
] as const;

function Placeholder({ children }: { children?: ReactNode }) {
	return (
		<div className="flex h-full w-full items-center justify-center bg-muted">
			{children}
		</div>
	);
}

/**
 * The 1 MB chunk loads after an interaction, so a flaky network or a chunk
 * hash gone stale after a deploy can reject the import. Without a boundary the
 * whole island unmounts; reloading the page is the reliable retry.
 */
class MapErrorBoundary extends Component<
	{ children: ReactNode; fallback: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export default function HeroMap(props: MapViewProps) {
	const [started, setStarted] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const t = ui[props.lang];

	useEffect(() => {
		if (started) return;
		const start = () => setStarted(true);
		for (const type of START_EVENTS) {
			window.addEventListener(type, start, { once: true, passive: true });
		}
		return () => {
			for (const type of START_EVENTS) window.removeEventListener(type, start);
		};
	}, [started]);

	// The button unmounts once the map starts; keep keyboard focus on the map
	// area instead of letting it fall back to <body>.
	const startFromButton = () => {
		setStarted(true);
		rootRef.current?.focus();
	};

	return (
		<div ref={rootRef} tabIndex={-1} className="h-full w-full outline-none">
			{!started ? (
				<Placeholder>
					<button
						type="button"
						onClick={startFromButton}
						className="cursor-pointer rounded-full border border-border-strong bg-card px-5 py-2.5 text-sm font-semibold text-card-foreground shadow-[0_4px_12px_rgba(31,27,22,0.08)] hover:border-foreground"
					>
						{t["map.show"]}
					</button>
				</Placeholder>
			) : (
				<MapErrorBoundary
					fallback={
						<Placeholder>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="cursor-pointer rounded-full border border-border-strong bg-card px-5 py-2.5 text-sm font-semibold text-card-foreground hover:border-foreground"
							>
								{t["map.retry"]}
							</button>
						</Placeholder>
					}
				>
					<Suspense
						fallback={
							<Placeholder>
								<span role="status" className="text-sm text-muted-foreground">
									{t["map.loading"]}
								</span>
							</Placeholder>
						}
					>
						<MapView {...props} />
					</Suspense>
				</MapErrorBoundary>
			)}
		</div>
	);
}
