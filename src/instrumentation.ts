import type { Instrumentation } from "next";

/**
 * Server error reporting (ROADMAP Phase 9). Every captured error becomes one structured log
 * line (picked up by the host's log drain); with ERROR_WEBHOOK_URL set it is also POSTed.
 * Headers and bodies are never forwarded — they carry session cookies.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const report = {
    level: "error",
    message: err instanceof Error ? err.message : String(err),
    digest:
      typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined,
    method: request.method,
    // Query strings can carry tokens (auth confirm links); keep the path only.
    path: request.path.split("?")[0],
    routePath: context.routePath,
    routeType: context.routeType,
    at: new Date().toISOString(),
  };
  console.error(JSON.stringify(report));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
    } catch {
      // Reporting must never turn one error into two.
    }
  }
};
