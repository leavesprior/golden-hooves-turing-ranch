import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    ".next.old/**",
    "out/**",
    "build/**",
    "scripts/**",
    "next-env.d.ts",
  ]),
  // Rule overrides: warnings for patterns that are common in this codebase
  // but not actual bugs. Errors reserved for things that break at runtime.
  {
    rules: {
      // These are ubiquitous in React init patterns (loading from localStorage)
      // and not actual bugs — just performance advice
      "react-hooks/set-state-in-effect": "warn",
      // Unescaped entities: cosmetic, not a bug
      "react/no-unescaped-entities": "warn",
      // ts-ignore vs ts-expect-error: preference, not a bug
      "@typescript-eslint/ban-ts-comment": "warn",
      // explicit any: tech debt to fix incrementally, not a blocker
      "@typescript-eslint/no-explicit-any": "warn",
      // React Compiler optimization hints (react-hooks v7) — these are
      // performance suggestions from the new compiler, not runtime bugs.
      // Downgrade to warn so CI catches real issues, not compiler optimization advice.
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/invariant": "warn",
    },
  },
]);

export default eslintConfig;
