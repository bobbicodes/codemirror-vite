import { defineConfig } from "vite";

export default defineConfig({
    base: '/lang-clojure-eval/',
    test: {
      browser: {
        enabled: true,
        name: 'chrome'
      },
    }
})