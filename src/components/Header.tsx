"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { projectAssets } from "@/config/assets";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import { legalNav, primaryNav } from "@/config/navigation";
import type { SiteContent } from "@/content";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type HeaderProps = {
  locale: Locale;
  content: SiteContent;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ locale, content }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const logo = projectAssets.logo;

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const closeMenu = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => buttonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocused && document.contains(previouslyFocused)) {
        // Focus restored via closeMenu when user dismisses; pathname change skips this.
      }
    };
  }, [open, closeMenu]);

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  }

  const navItems = [...primaryNav, ...legalNav];

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]/95 backdrop-blur-sm">
      <div className="site-container flex min-h-[4.5rem] items-center justify-between gap-3 py-2">
        <Link
          href="/"
          className="flex min-h-12 min-w-0 items-center gap-2.5 rounded-[var(--bm-radius-sm)] py-1 pr-2"
        >
          <Image
            src={logo.src}
            alt={t(logo.alt, locale)}
            width={40}
            height={53}
            className="h-11 w-auto shrink-0"
            priority
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-snug text-[color:var(--bm-primary)] sm:text-base">
              {t(mosqueConfig.shortName, locale)}
            </span>
            <span className="hidden text-xs text-[color:var(--bm-text-secondary)] sm:block">
              {content.shell.footerNote}
            </span>
          </span>
        </Link>

        <nav
          aria-label={content.shell.primaryNavLabel}
          className="hidden items-center gap-1 lg:flex"
        >
          {primaryNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-12 items-center rounded-[var(--bm-radius-sm)] px-3 text-sm font-medium ${
                  active
                    ? "bg-[color:var(--bm-primary)]/10 text-[color:var(--bm-primary)]"
                    : "text-[color:var(--bm-text)] hover:bg-[color:var(--bm-primary)]/8 hover:text-[color:var(--bm-primary)]"
                }`}
              >
                {item.label[locale]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher
            locale={locale}
            label={content.shell.languageLabel}
            labelBn={content.shell.languageBn}
            labelEn={content.shell.languageEn}
            compact
          />

          <div className="hidden md:block">
            <Link href="/support" className="btn btn-primary min-h-12 px-4 text-sm">
              {content.shell.ctaSupport}
            </Link>
          </div>

          <button
            ref={buttonRef}
            type="button"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] text-[color:var(--bm-primary)] lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">
              {open ? content.shell.menuClose : content.shell.menuOpen}
            </span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id={menuId}
          ref={panelRef}
          className="border-t border-[color:var(--bm-border)] bg-[color:var(--bm-surface)] lg:hidden"
          onKeyDown={onMenuKeyDown}
        >
          <nav
            aria-label={content.shell.primaryNavLabel}
            className="site-container flex max-h-[min(80vh,36rem)] flex-col gap-1 overflow-y-auto py-3 pb-[calc(var(--bm-mobile-bar)+1rem)]"
          >
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center rounded-[var(--bm-radius-sm)] px-3 text-base font-medium ${
                    active
                      ? "bg-[color:var(--bm-primary)]/10 text-[color:var(--bm-primary)]"
                      : "text-[color:var(--bm-text)] hover:bg-[color:var(--bm-primary)]/8"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label[locale]}
                </Link>
              );
            })}
            <Link
              href="/support"
              className="btn btn-primary mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {content.shell.ctaSupport}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
