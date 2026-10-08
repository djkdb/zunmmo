// OpenNext adapter for Cloudflare Workers (docs/DEPLOY.md §6).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Nothing revalidates on a timer: player screens are dynamic per request and the rest is
// prerendered at build, so build output served from static assets is enough — no R2 bucket.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: false,
});
