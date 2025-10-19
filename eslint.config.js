import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";

export default [
  {
    ignores: ["node_modules/", "dist/", "build/", ".husky/", "*.config.js"],
  },
  js.configs.recommended,
  prettier,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "prettier/prettier": "error",
      indent: ["error", 2],
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
  },
];
