"use client";

import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 transition-transform duration-200 ease-out ${
        open ? "rotate-90 scale-95" : "rotate-0 scale-100"
      }`}
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </>
      )}
    </svg>
  );
}

export function TopNav({
  sectionLabels,
  resumeDownloadHref,
}: {
  sectionLabels: string[];
  resumeDownloadHref?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Prevent browser scroll-restoration from reopening at a previous position.
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  const navItems: NavItem[] = [
    { label: "Home", href: "#home" },
    ...sectionLabels.map((label) => ({
      label,
      href: `#${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
    })),
  ];
  const downloadItems: NavItem[] = [
    { label: "Download CV", href: "/api/cv" },
    { label: "Download Résumé", href: resumeDownloadHref ?? "/resume/pdf" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-sm">
      <div className="border-b border-stone-300 bg-white/95">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-16">
          <a
            href="#home"
            className="text-xl font-semibold tracking-wide text-[#1a1a1a]"
          >
            Elijah Frost
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            className="inline-flex min-h-11 items-center gap-2 px-2 py-2.5 text-xs tracking-[0.16em] uppercase sm:tracking-[0.2em]"
          >
            <MenuIcon open={open} />
            Menu
          </button>
        </div>

        <nav
          id="site-menu"
          className={`grid overflow-hidden bg-white/95 transition-[grid-template-rows] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open
              ? "grid-rows-[1fr] duration-[170ms]"
              : "pointer-events-none grid-rows-[0fr] duration-[130ms]"
          }`}
        >
          <div className="min-h-0">
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 pt-3 pb-7 sm:grid-cols-2 sm:px-10 lg:px-16">
            <div>
              <p className="mb-2 text-[10px] tracking-[0.18em] text-stone-500 uppercase">
                In This Page
              </p>
              <div className="grid grid-cols-1 gap-1 border-l border-stone-300 pl-3">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className="py-2.5 text-xs tracking-[0.12em] text-[#1a1a1a] uppercase hover:opacity-60 sm:py-1.5 sm:tracking-[0.14em]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] tracking-[0.18em] text-stone-500 uppercase">
                Downloads
              </p>
              <div className="grid grid-cols-1 gap-1 border-l border-stone-300 pl-3">
                {downloadItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className="py-2.5 text-xs tracking-[0.12em] text-[#1a1a1a] uppercase hover:opacity-60 sm:py-1.5 sm:tracking-[0.14em]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
