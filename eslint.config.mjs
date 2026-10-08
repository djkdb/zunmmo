import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Dependency direction (docs/ARCHITECTURE.md §2):
// app → features → components/game → components/pixel | components/ui → lib
const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Game rules are pure TypeScript: no React, Next, Supabase or app code.
    files: ["src/lib/game/**"],
    rules: restrict([
      {
        group: ["react", "react-dom", "next", "next/*", "@supabase/*", "@/*", "!@/lib/game/*"],
        message: "lib/game must stay framework-free.",
      },
    ]),
  },
  {
    files: ["src/components/**"],
    rules: restrict([
      {
        group: ["@/features/*", "@/app/*"],
        message: "Components must not depend on features or routes.",
      },
    ]),
  },
  {
    files: ["src/components/pixel/**", "src/components/ui/**"],
    rules: restrict([
      {
        group: ["@/components/game/*", "@/features/*", "@/app/*"],
        message: "Primitives must not depend on game components.",
      },
    ]),
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
