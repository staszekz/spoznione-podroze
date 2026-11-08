import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MobileMenuProps {
	items: { href: string; label: string }[];
	openLabel: string;
	closeLabel: string;
}

export default function MobileMenu({
	items,
	openLabel,
	closeLabel,
}: MobileMenuProps) {
	const [open, setOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Escape closes the open menu and returns focus to the toggle, so keyboard
	// users stay where they were.
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape" || event.defaultPrevented) return;
			setOpen(false);
			buttonRef.current?.focus();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open]);

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				aria-label={open ? closeLabel : openLabel}
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
				className="flex size-11 items-center justify-center rounded-full border border-border text-foreground"
			>
				{open ? (
					<X className="size-[18px]" />
				) : (
					<Menu className="size-[18px]" />
				)}
			</button>
			{open && (
				<div className="absolute inset-x-5 top-[72px] z-50 rounded-2xl border border-border bg-card p-3 shadow-[0_14px_24px_rgba(31,27,22,0.12)]">
					<nav className="flex flex-col">
						{items.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="rounded-xl px-4 py-3 text-[15px] font-medium text-nav-foreground hover:bg-muted hover:text-foreground"
							>
								{item.label}
							</a>
						))}
					</nav>
				</div>
			)}
		</>
	);
}
