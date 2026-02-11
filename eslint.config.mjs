import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules to fix your linting issues
  {
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      // Allow 'any' during development (change to 'warn' or 'error' later)
      "@typescript-eslint/no-explicit-any": "off",

      // Handle unused variables (ignore variables prefixed with _)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      // React Hooks rules
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // Other helpful rules
      "no-console": "warn",
      "@typescript-eslint/ban-ts-comment": "off"
    }
  }
]);

export default eslintConfig;
