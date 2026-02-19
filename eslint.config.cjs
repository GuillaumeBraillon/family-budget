/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const { defineConfig, globalIgnores } = require("eslint/config");

const globals = require("globals");

const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const reactRefresh = require("eslint-plugin-react-refresh");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const react = require("eslint-plugin-react");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    extends: fixupConfigRules(
      compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime"
      )
    ),

    plugins: {
      "react-refresh": reactRefresh,
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      react: fixupPluginRules(react),
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      /*         "react-refresh/only-export-components": ["warn", {
            allowConstantExport: true,
        }], */

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],

      "prefer-const": "warn",
    },
  },
  globalIgnores([
    "**/node_modules",
    "**/dist",
    "**/build",
    "**/.vite",
    "**/.vercel",
    "**/.env",
    "**/.env.local",
    "**/.env.production",
    "**/\\*.log",
    "**/coverage",
    "**/tests/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/public/sw.js",
  ]),
]);
