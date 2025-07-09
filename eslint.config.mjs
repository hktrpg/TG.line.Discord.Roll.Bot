import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 11,
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        // Custom globals from original .eslintrc
        "$": "readonly", // jQuery
        "Vue": "readonly", // Vue.js
        "io": "readonly", // Socket.io
        "expect": "readonly", // Jest
        "describe": "readonly", // Jest
        "it": "readonly", // Jest
        "beforeEach": "readonly", // Jest
        "afterEach": "readonly", // Jest
        "beforeAll": "readonly", // Jest
        "afterAll": "readonly", // Jest
        "test": "readonly", // Jest
      }
    },
    rules: {}
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module"
    }
  }
];
