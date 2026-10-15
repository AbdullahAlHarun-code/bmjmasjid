"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { PhotoMeta } from "@/components/PhotoMeta";
import type { ProjectAsset } from "@/config/assets";
import { t, type Locale } from "@/config/mosque";
import type { PhotoDateCopy, UpdatesContent } from "@/content/types";

type PhotoGalleryProps = {
  locale: Locale;
  photos: readonly ProjectAsset[];
  copy: UpdatesContent;
  photoDates: PhotoDateCopy;
};

export function PhotoGallery({ locale, photos, copy, photoDates }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const open = activeIndex !== null;
  const activePhoto = open ? photos[activeIndex] : null;

  const closeViewer = useCallback(() => {
    const index = activeIndex;
    setActiveIndex(null);
    queueMicrotask(() => {
      if (index !== null) {
        triggerRefs.current[index]?.focus();
      }
    });
  }, [activeIndex]);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = dialogRef.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

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
        // Focus returns via closeViewer when dismissed by the user.
      }
    };
  }, [open, closeViewer, showPrevious, showNext]);

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeViewer();
    }
  }

  const positionLabel =
    activeIndex !== null
      ? copy.viewer.position
          .replace("{current}", String(activeIndex + 1))
          .replace("{total}", String(photos.length))
      : "";

  return (
    <>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              onClick={() => setActiveIndex(index)}
              className="group w-full overflow-hidden rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-surface)] text-left shadow-[var(--bm-shadow)] transition hover:border-[color:var(--bm-primary)]/35 focus-visible:border-[color:var(--bm-primary)]"
            >
              <Image
                src={photo.src}
                alt={t(photo.alt, locale)}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="aspect-[4/3] h-auto w-full object-cover transition group-hover:brightness-[0.98]"
                style={{ objectPosition: photo.objectPosition }}
                loading="lazy"
              />
              <span className="block p-4">
                <span className="block text-sm leading-relaxed text-[color:var(--bm-text-secondary)]">
                  {t(photo.caption, locale)}
                </span>
                <PhotoMeta
                  asset={photo}
                  locale={locale}
                  labels={photoDates}
                  className="mt-2"
                />
                <span className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[color:var(--bm-primary)]">
                  {copy.openImage}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && activePhoto ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgb(23_37_31_/_0.88)] p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[min(96vh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--bm-radius)] bg-[color:var(--bm-surface)] shadow-[var(--bm-shadow)]"
            onKeyDown={onDialogKeyDown}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--bm-border)] px-4 py-3">
              <p
                id={titleId}
                className="min-w-0 truncate text-sm font-semibold text-[color:var(--bm-primary)]"
              >
                {copy.viewer.dialogLabel}
                <span className="mx-2 text-[color:var(--bm-text-secondary)]" aria-hidden>
                  ·
                </span>
                <span className="font-medium text-[color:var(--bm-text-secondary)]">
                  {positionLabel}
                </span>
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={closeViewer}
                className="btn btn-secondary min-h-11 px-3 text-sm"
              >
                {copy.viewer.close}
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[color:var(--bm-background)] px-2 py-4 sm:px-4">
              <Image
                src={activePhoto.src}
                alt={t(activePhoto.alt, locale)}
                width={activePhoto.width}
                height={activePhoto.height}
                sizes="100vw"
                className="max-h-[min(70vh,40rem)] w-auto max-w-full object-contain"
                style={{ objectPosition: activePhoto.objectPosition }}
                priority
              />
            </div>

            <div className="border-t border-[color:var(--bm-border)] px-4 py-3">
              <p className="text-sm leading-relaxed text-[color:var(--bm-text)]">
                {t(activePhoto.caption, locale)}
              </p>
              <PhotoMeta
                asset={activePhoto}
                locale={locale}
                labels={photoDates}
                className="mt-2"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={showPrevious}
                  className="btn btn-secondary min-h-11 flex-1 px-3 text-sm sm:flex-none"
                >
                  {copy.viewer.previous}
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="btn btn-secondary min-h-11 flex-1 px-3 text-sm sm:flex-none"
                >
                  {copy.viewer.next}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
