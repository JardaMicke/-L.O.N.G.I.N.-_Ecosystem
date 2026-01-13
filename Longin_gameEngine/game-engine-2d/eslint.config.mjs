import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    ignores: ["dist/", "coverage/", "**/*.d.ts", "jest.config.js"]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { 
        globals: globals.node 
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
      plugins: {
          import: importPlugin,
          "unused-imports": unusedImports
      },
      rules: {
        "no-console": "warn",
        "no-debugger": "error",
        "no-var": "error",
        "prefer-const": "error",
        "eqeqeq": ["error", "always"],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
            "warn",
            { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
        ],
        "import/order": [
          "error",
          {
            "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
            "newlines-between": "always",
            "alphabetize": { "order": "asc", "caseInsensitive": true }
          }
        ]
      }
  }
];
