"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import type { ShareContent } from "@/content";

type ShareProjectProps = {
  copy: ShareContent;
  /** Optional path to share; defaults to the current page URL at runtime. */
  path?: string;
};

function buildShareUrl(path?: string) {
  if (typeof window === "undefined") return "";
  if (path) {
    return new URL(path, window.location.origin).toString();
  }
  return window.location.href;
}

function buildMessage(template: string, url: string) {
  return template.replace("{url}", url);
}

function subscribeNativeShare() {
  return () => {};
}

function getNativeShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function getNativeShareServerSnapshot() {
  return false;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  if (!ok) {
    throw new Error("copy failed");
  }
}

export function ShareProject({ copy, path }: ShareProjectProps) {
  const titleId = useId();
  const statusId = useId();
  const canNativeShare = useSyncExternalStore(
    subscribeNativeShare,
    getNativeShareSnapshot,
    getNativeShareServerSnapshot,
  );
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 3500);
    return () => window.clearTimeout(timer);
  }, [status]);

  function getPayload() {
    const url = buildShareUrl(path);
    const text = buildMessage(copy.message, url);
    return { url, text };
  }

  async function onNativeShare() {
    const { url, text } = getPayload();
    if (!url || !navigator.share) return;
    try {
      await navigator.share({
        title: document.title,
        text,
        url,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  }

  function onWhatsAppShare() {
    const { text } = getPayload();
    if (!text) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function onCopyLink() {
    const { url } = getPayload();
    if (!url) {
      setStatus("error");
      return;
    }
    try {
      await copyText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const statusMessage =
    status === "copied" ? copy.copied : status === "error" ? copy.copyError : "";

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-2xl font-semibold text-[color:var(--bm-primary)]">
        {copy.title}
      </h2>
      <p className="mt-3 text-[color:var(--bm-text-secondary)]">{copy.intro}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canNativeShare ? (
          <button type="button" className="btn btn-primary" onClick={onNativeShare}>
            {copy.nativeShare}
          </button>
        ) : null}
        <button type="button" className="btn btn-secondary" onClick={onWhatsAppShare}>
          {copy.whatsapp}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCopyLink}>
          {copy.copyLink}
        </button>
      </div>
      <p
        id={statusId}
        className="mt-3 min-h-6 text-sm text-[color:var(--bm-text-secondary)]"
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </p>
    </section>
  );
}
