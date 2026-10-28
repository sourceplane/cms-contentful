// eslint-config-next 16 ships flat configs; this is what `create-next-app`
// generates for Next 16 (the template carries no lint config of its own).
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The template types its Contentful responses as `any` throughout
    // (lib/api.ts, the page and component props). Kept as written.
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    // The content-model import script is the template's CommonJS Node script.
    files: ["lib/setup.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", ".open-next/**", ".wrangler/**", "next-env.d.ts"]),
]);
