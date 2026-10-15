/**
 * Same-origin check for mutation endpoints.
 * Accepts matching Origin, or a same-host Referer when Origin is absent.
 */
export function isSameOriginRequest(request: Request): boolean {
  const configured = process.env.APP_ORIGIN?.trim();
  if (!configured && process.env.NODE_ENV === "production") return false;
  let url: URL;
  try { url = new URL(configured || request.url); } catch { return false; }
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const parsed = new URL(origin);
      return parsed.host === url.host && parsed.protocol === url.protocol;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    const parsed = new URL(referer);
    return parsed.host === url.host && parsed.protocol === url.protocol;
  } catch {
    return false;
  }
}
