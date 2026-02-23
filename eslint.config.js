import js from "@eslint/js";
import globals from "globals";
import vue from "eslint-plugin-vue";

export default [
  {
    ignores: ["dist/**", "playwright-report/**", "test-results/**"]
  },
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        __APP_VERSION__: "readonly"
      }
    }
  },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    rules: {
      "vue/multi-word-component-names": "off"
    }
  }
];
