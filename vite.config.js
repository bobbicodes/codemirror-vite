import { defineConfig } from "vite";

export default defineConfig({
    base: '/lang-clojure-eval/',
    test: {
        /* for example, use global to avoid globals imports (describe, test, expect): */
        // globals: true,
      }
})