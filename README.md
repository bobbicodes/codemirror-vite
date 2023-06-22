# lang-clojure-eval

A Codemirror 6 language extension based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## Demo

```bash
npm install
npm run dev
```

## Credits

- The [lang-clojure](https://github.com/nextjournal/lang-clojure/) project includes the Lezer parser extended with highlighting and indentation information.

- Evaluation functionality ported from Nextjurnal's [clojure-mode](https://github.com/nextjournal/clojure-mode/tree/main).

- [SCI](https://github.com/babashka/sci) compiled to ESM with [shadow-cljs](https://github.com/thheller/shadow-cljs).
