import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/server/db/pool";
import { createCsrfToken, setCsrfCookie } from "@/server/donation-reports/csrf";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 },
    );
  }

  const token = createCsrfToken();
  await setCsrfCookie(token);
  return NextResponse.json({ ok: true, token });
}
