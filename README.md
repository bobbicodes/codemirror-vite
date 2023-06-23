# lang-clojure-eval

A Codemirror 6 language extension based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## Status

Not working yet, but making steady progress. There is a [live demo](https://bobbicodes.github.io/lang-clojure-eval/) running which is continuously built from the main branch.

## Run demo locally

```bash
npm install
npm run dev
```

## Dev

To compile sci.js from the Clojurescript source:

```bash
npx shadow-cljs release sci
```

## Credits

- The [lang-clojure](https://github.com/nextjournal/lang-clojure/) extension provides the Lezer parser, highlighting and formatting information.
- Evaluation functionality ported from Nextjurnal's [clojure-mode](https://github.com/nextjournal/clojure-mode/).
- [SCI](https://github.com/babashka/sci) compiled to ESM with [shadow-cljs](https://github.com/thheller/shadow-cljs).
