# lang-clojure-eval

A Codemirror 6 language extension based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## Demo

```bash
npm install
npm run dev
```

## Dev

The library for generating the ESM module for parsing Lezer syntax trees lives at https://github.com/bobbicodes/lezer-shadow. SCI is compiled with this project:

```bash
npx shadow-cljs release sci
```

## Credits

- The [lang-clojure](https://github.com/nextjournal/lang-clojure/) extension provides the Lezer parser, highlighting and formatting information.
- Evaluation functionality ported from Nextjurnal's [clojure-mode](https://github.com/nextjournal/clojure-mode/).
- [SCI](https://github.com/babashka/sci) compiled to ESM with [shadow-cljs](https://github.com/thheller/shadow-cljs).
