import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".taste-skill/**", "storage/**"]),
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    rules: {
      "no-alert": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "Native <select> is banned. Use <Select> from components/ui/select.",
        },
        {
          selector: "JSXOpeningElement[name.name='dialog']",
          message: "Native <dialog> is banned. Use Dialog / AlertDialog from components/ui.",
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**"],
    rules: { "max-lines": "off" },
  },
]);

export default eslintConfig;
