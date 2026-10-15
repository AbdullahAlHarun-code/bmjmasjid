import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { isDatabaseConfigured } from "@/server/db/pool";
import { csrfTokensMatch, readCsrfCookie } from "@/server/donation-reports/csrf";
import { isSameOriginRequest } from "@/server/donation-reports/origin";
import { hashRateKey, consumeRateLimit } from "@/server/donation-reports/rate-limit";
import { insertDonationReport, RetryConflictError } from "@/server/donation-reports/repository";
import { FIELD_LIMITS, type DonationReportInput } from "@/server/donation-reports/types";
import { validateDonationReport } from "@/server/donation-reports/validate";

function clientIp(request: Request): string {
  // Only accept an address supplied by a proxy explicitly trusted by the operator.
  if (process.env.DONATION_TRUST_PROXY_IP !== "true") return "shared-untrusted";
  return request.headers.get("x-real-ip")?.trim() || "shared-untrusted";
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > FIELD_LIMITS.bodyMaxBytes) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = await readCsrfCookie();
  if (!csrfTokensMatch(csrfCookie, csrfHeader)) {
    return NextResponse.json({ ok: false, error: "csrf" }, { status: 403 });
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return NextResponse.json(
      { ok: false, error: "idempotency_required" },
      { status: 400 },
    );
  }

  try {
    const ipHash = createHash("sha256").update(clientIp(request)).digest("hex");
    const rate = await consumeRateLimit(
      hashRateKey(["donation-report", ipHash]),
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 503 });
  }

  let body: DonationReportInput;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > FIELD_LIMITS.bodyMaxBytes) {
        await reader.cancel();
        return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
      }
      chunks.push(chunk.value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as DonationReportInput;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const validated = validateDonationReport(body);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: "validation", fields: validated.errors },
      { status: 400 },
    );
  }

  try {
    const result = await insertDonationReport({
      validated: validated.value,
      idempotencyKey,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      publicRef: result.row.public_ref,
      status: result.row.status,
      duplicateTrxFlag: Boolean(result.row.duplicate_trx_flag),
    });
  } catch (error) {
    if (error instanceof RetryConflictError) {
      return NextResponse.json({ ok: false, error: "retry_conflict" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 503 });
  }
}
