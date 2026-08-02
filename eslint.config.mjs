import parserTypescript from "@typescript-eslint/parser";
import parserVue from "vue-eslint-parser";

export default [
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        ecmaVersion: 2022,
        parser: parserTypescript,
        sourceType: "module",
      },
    },
    rules: {
      "no-shadow": "error",
      "no-use-before-define": "error",
    },
  },
];
