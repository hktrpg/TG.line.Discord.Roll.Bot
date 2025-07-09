import js from "@eslint/js";
import globals from "globals";
import unicorn from "eslint-plugin-unicorn";
import importPlugin from "eslint-plugin-import";
import nPlugin from "eslint-plugin-n";

export default [
  js.configs.recommended,
  unicorn.configs["flat/recommended"],
  nPlugin.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
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
    plugins: {
      import: importPlugin,
      n: nPlugin
    },
    rules: {
      // Unicorn rules adjustments for this project
      "unicorn/prefer-module": "off", // This project uses CommonJS
      "unicorn/prefer-top-level-await": "off", // Not applicable for CommonJS
      "unicorn/filename-case": ["error", { 
        "case": "kebabCase", 
        "ignore": [
          /^z_.*\.js$/,
          /^candleDays\.js$/,
          /^core-.*\.js$/,
          /^ds-.*\.js$/,
          /^dbWatchdog\.js$/,
          /^getRoll\.js$/,
          /^veryImportantPerson\.js$/,
          /^discord_.*\.js$/,
          /^handleMessage\.js$/,
          /^discord_client\.js$/
        ]
      }], // Allow z_ prefix and legacy files
      "unicorn/prevent-abbreviations": "off", // Allow common abbreviations in this codebase
      "unicorn/no-array-reduce": "off", // Allow reduce usage
      "unicorn/no-process-exit": "off", // Allow process.exit in this type of application
      "unicorn/prefer-node-protocol": "off", // Disable due to Node.js 14 compatibility
      "unicorn/no-null": "off", // Allow null usage in this codebase
      "unicorn/consistent-function-scoping": "off", // Allow flexible function scoping
      "unicorn/import-style": "off", // Allow mixed import styles
      "unicorn/no-array-callback-reference": "off", // Allow passing functions directly to array methods
      "unicorn/prefer-logical-operator-over-ternary": "off", // Allow ternary operators for readability
      "unicorn/no-instanceof-builtins": "off", // Allow instanceof checks when needed
      "unicorn/new-for-builtins": "off", // Allow Date() constructor usage
      "unicorn/no-array-method-this-argument": "off", // Allow this argument in array methods
      "unicorn/prefer-ternary": "off", // Allow if-else statements for clarity
      "unicorn/no-for-loop": "off", // Allow traditional for loops
      "unicorn/no-nested-ternary": "off", // Allow nested ternary for complex logic
      "unicorn/prefer-math-trunc": "off", // Allow ~~ operator for performance
      "unicorn/no-negated-condition": "off", // Allow negated conditions
            "unicorn/prefer-string-starts-ends-with": "off", // Allow regex patterns
      "unicorn/no-lonely-if": "off", // Allow single if statements
      "no-irregular-whitespace": "off", // Allow irregular whitespace in this legacy codebase
            "unicorn/prefer-event-target": "off", // Allow EventEmitter in Node.js
      "unicorn/prefer-set-has": "off", // Allow array includes for simple cases
            "unicorn/switch-case-braces": "off", // Allow switch cases without braces
      "unicorn/prefer-optional-catch-binding": "off", // Allow catch bindings for clarity
      "no-empty": "off", // Allow empty blocks in legacy code
            
      // Node.js plugin adjustments
      "n/no-missing-import": "off", // Sometimes conflicts with local modules
      "n/no-extraneous-import": "off", // Let package.json handle this
      "n/no-unpublished-import": "off", // Allow dev dependencies in config files
      "n/no-unsupported-features/node-builtins": "off", // Allow older Node.js compatibility
      
      // Import plugin rules - more relaxed
      "import/order": ["warn", {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "ignore" // Allow flexible spacing
      }],
      "import/no-unresolved": "off", // Sometimes conflicts with dynamic requires
      "import/no-dynamic-require": "off", // This project uses dynamic requires extensively
      
      // Node.js specific rules
      "no-console": "off", // Allow console in Node.js applications
      "no-process-env": "off", // Allow process.env usage
    }
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module"
    },
    rules: {
      "unicorn/prefer-module": "error", // Enable for ES modules
      "unicorn/prefer-node-protocol": "error" // Enable for ES modules
    }
  },
  {
    files: ["test/**/*.js", "**/*.test.js"],
    rules: {
      // Relaxed rules for test files
      "unicorn/no-null": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/prefer-module": "off",
      "n/no-unpublished-require": "off"
    }
  }
];
