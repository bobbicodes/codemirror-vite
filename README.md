# lang-clojure-eval

A language provider based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## Demo

```bash
npm install
npm run dev
```

## Credits

The Nextjournal team's efforts are what made this possible, it would have taken me years to figure all of this out. The [lang-clojure](https://github.com/nextjournal/lang-clojure/) project includes the Lezer parser extended with highlighting and indentation information, and [clojure-mode](https://github.com/nextjournal/clojure-mode/tree/main) is a Clojurescript library that showed me everything I needed to know to learn Codemirror 6. Finally, Michiel Borkent for [SCI](https://github.com/babashka/sci) which powers in-browser evaluation, which is compiled into an ESM module with [shadow-cljs](https://github.com/thheller/shadow-cljs).