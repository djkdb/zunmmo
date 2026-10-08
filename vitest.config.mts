import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    // DB suites share one local database; run files serially to keep them independent.
    fileParallelism: false,
    coverage: { include: ["src/lib/game/**"] },
  },
});
