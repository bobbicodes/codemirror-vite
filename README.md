# lang-clojure-eval [![NPM version](https://img.shields.io/npm/v/lang-clojure-eval?color=purple)](https://www.npmjs.com/package/lang-clojure-eval)

A Codemirror 6 language extension based on the [Lezer Clojure](https://github.com/nextjournal/lezer-clojure) parser, with inline-evaluation support via the [Small Clojure Interpreter (SCI)](https://github.com/babashka/sci).

## API Reference
<dl>
<dt>
  <code><strong><a href="https://github.com/bobbicodes/lang-clojure-eval/blob/bce8ebaf2e2989cd3d7d1d393cf50977442c1eaa/main.js#L11">clojure</a></strong>() → <a href="https://codemirror.net/docs/ref#language.LanguageSupport">LanguageSupport</a></code></dt>

<dd><p>Clojure language support.</p>
</dd>
<dt>
  <code><strong><a href="https://github.com/bobbicodes/lang-clojure-eval/blob/5e79a06a6f8b46ea8e3f2bbbdb701983752db0a4/main.js#L55">clojureLanguage</a></strong>: <a href="https://codemirror.net/docs/ref#language.LRLanguage">LRLanguage</a></code></dt>

<dd><p>A language provider based on the <a href="https://github.com/nextjournal/lezer-clojure">Lezer Clojure
parser</a>, extended with
highlighting and indentation information.</p>
</dd>
<dt>
  <code><strong><a href="https://github.com/bobbicodes/lang-clojure-eval/blob/5e79a06a6f8b46ea8e3f2bbbdb701983752db0a4/eval-region.js#L178">evalExtension</a></strong>: <a href="https://codemirror.net/docs/ref#state.Extension">Extension</a></code></dt>

<dd><p>Inline-evaluation support via the <a href="https://github.com/babashka/sci">Small Clojure Interpreter</a></p>
</dd>
</dl>

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
