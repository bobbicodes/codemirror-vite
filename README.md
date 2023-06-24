# lang-clojure-eval

A Codemirror 6 language extension based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## Status

Not ready to ship yet, but making steady progress. There is a [live demo](https://bobbicodes.github.io/lang-clojure-eval/) running which is continuously built from the main branch. The architecture is sound, eval-cell works, but the functions for selecting regions are incomplete. Currently eval results are logged to the console, but when finished will be integrated into the main editor UI. I might consider displaying it via an annotation or something, but my current plan is to dispatch actual changes to the editor text, which will immediately revert back on the next user event, with the exception of selecting and copying the results which would be good to allow.

- [x] Implement Lezer parser
- [x] Hook up Clojure interpreter
- [x] Eval-cell
- [X] Eval-at-cursor
- [X] Eval top-level form
- [ ] Display results inline
- [ ] Implement clear-events

Eval at cursor is working, but currently only for simple forms. Forms with prefixes, eg. `#(+ 1 %)` not yet implemented.

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
