import { deployedCommit } from "@/server/deployed-commit";

/**
 * Public liveness check for the existing HTTPS site.
 * The commit is baked in at build time so a restarted process serves the
 * deployed SHA, while the previous process keeps serving its own build.
 */
export function GET() {
  return Response.json(
    { ok: true, sha: deployedCommit },
    { headers: { "cache-control": "no-store" } },
  );
}
