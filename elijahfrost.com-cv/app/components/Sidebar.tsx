"use client";

import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    id: "home",
    label: "HOME",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "about",
    label: "ABOUT",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: "education",
    label: "EDUCATION",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M22 10L12 5 2 10l10 5 10-5z" />
        <path d="M6 12.5v5c3 2.5 9 2.5 12 0v-5" />
      </svg>
    ),
  },
  {
    id: "research",
    label: "RESEARCH",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M9 3h6M10 3v7l-4 8h12l-4-8V3" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "experience",
    label: "EXPERIENCE",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: "recognition",
    label: "RECOGNITION",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: "skills",
    label: "SKILLS",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: "contact",
    label: "CONTACT",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="2,6 12,13 22,6" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -60% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-stone-100 bg-white">
      <div className="flex h-16 items-center border-b border-stone-100 px-6">
        <span className="font-serif text-sm font-semibold tracking-wide text-stone-900">
          EF
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`group relative flex items-center gap-3 px-6 py-2.5 text-xs font-medium tracking-widest transition-colors ${
                isActive
                  ? "text-stone-900"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <span
                className={`absolute left-0 h-5 w-0.5 rounded-r transition-all ${
                  isActive ? "bg-stone-900 opacity-100" : "opacity-0"
                }`}
              />
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-stone-100 px-6 py-4">
        <p className="text-[10px] tracking-widest text-stone-300 uppercase">
          © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
