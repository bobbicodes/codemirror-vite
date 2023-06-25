# lang-clojure-eval [![NPM version](https://img.shields.io/npm/v/lang-clojure-eval.svg)](https://www.npmjs.com/package/lang-clojure-eval)

A Codemirror 6 language extension based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## Status

Alpha. Certainly contains bugs. There is a [live demo](https://bobbicodes.github.io/lang-clojure-eval/) running which is continuously built from the main branch.

- [x] Implement Lezer parser
- [x] Hook up Clojure interpreter
- [x] Eval-cell
- [X] Eval-at-cursor
- [X] Eval top-level form
- [X] Display results inline
- [X] Implement clear-events
- [X] [Publish to npm](https://www.npmjs.com/package/lang-clojure-eval)
- [ ] Test published package
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
- Evaluation functionality ported from Nextjournal's [clojure-mode](https://github.com/nextjournal/clojure-mode/).
- [SCI](https://github.com/babashka/sci) compiled to ESM with [shadow-cljs](https://github.com/thheller/shadow-cljs).
