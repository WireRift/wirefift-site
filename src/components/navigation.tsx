"use client";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Github,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { docs } from "@/lib/docs";
import { REPO } from "@/lib/site";
import { AnimationToggle } from "./animation-toggle";
import { Logo } from "./logo";
import { ThemePicker } from "./theme-picker";

export function Navigation() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const results = docs.filter((d) =>
    `${d.title} ${d.description} ${d.sections.map((s) => `${s.title} ${s.text}`).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  function openSearch() {
    setMenu(false);
    setQuery("");
    dialog.current?.showModal();
    input.current?.focus();
  }
  function closeSearch() {
    dialog.current?.close();
    searchTrigger.current?.focus();
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else {
          setQuery("");
          dialog.current?.showModal();
          input.current?.focus();
        }
      }
      if (e.key === "Escape") {
        const mobileMenu = document.getElementById("mobile-menu");
        if (mobileMenu?.contains(document.activeElement))
          menuTrigger.current?.focus();
        setMenu(false);
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const links = [
    ["Why WireRift", "/#features"],
    ["Documentation", "/docs/getting-started/"],
    ["Download", "/download/"],
    ["Changelog", "/changelog/"],
  ];
  return (
    <>
      <header className="site-header">
        <div className="header-inner container">
          <Link
            href="/"
            aria-label="WireRift home"
            onClick={() => setMenu(false)}
          >
            <Logo />
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              ref={searchTrigger}
              className="search-trigger"
              type="button"
              aria-label="Search documentation"
              onClick={openSearch}
            >
              <Search size={16} />
              <kbd>⌘ K</kbd>
            </button>
            <ThemePicker />
            <AnimationToggle />
            <a
              href={REPO}
              className="header-github"
              aria-label="WireRift on GitHub"
            >
              <Github size={17} />
              <span>GitHub</span>
              <ArrowUpRight size={13} />
            </a>
            <button
              type="button"
              className="menu-trigger"
              ref={menuTrigger}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Mobile navigation"
          >
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenu(false)}>
                {label}
                <ArrowRight size={16} />
              </Link>
            ))}
            <a href={REPO}>
              Source on GitHub
              <ArrowUpRight size={16} />
            </a>
          </nav>
        )}
      </header>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-labelledby="search-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSearch();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeSearch();
        }}
      >
        <div className="search-top">
          <Search size={21} />
          <label className="sr-only" id="search-title" htmlFor="docs-search">
            Search documentation
          </label>
          <input
            id="docs-search"
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation…"
            autoComplete="off"
          />
          <button type="button" aria-label="Close search" onClick={closeSearch}>
            <X size={20} />
          </button>
        </div>
        <div className="search-results" aria-live="polite">
          {results.length ? (
            results.map((d) => (
              <Link
                href={`/docs/${d.slug}/`}
                key={d.slug}
                onClick={() => dialog.current?.close()}
              >
                <BookOpen size={18} />
                <span>
                  <strong>{d.title}</strong>
                  <small>{d.description}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))
          ) : (
            <p className="search-empty">
              No results for “{query}”. Try “TLS”, “TCP”, or “server”.
            </p>
          )}
        </div>
        <div className="search-bottom">
          <span>Documentation, without the detour.</span>
          <kbd>ESC to close</kbd>
        </div>
      </dialog>
    </>
  );
}
