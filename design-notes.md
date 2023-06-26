- Trying to implement `eval-top-level-form` is harder than I thought.
	- It seems so simple... just find the form the cursor is in and evaluate it.
	- I can think of 2 ways:
		- use the clojure reader to pop each form off that doesn't have the cursor in it.
			- Where this gets tricky is keeping track of where the cursor is when we are chopping off code, we could count the forms as they are removed and reposition the cursor, but then we have to deal with whitespace and seems like a mess
		- begin at the cursor and expand outward in both directions until we have the entire form
	- I like the second one, it avoids needing to use the reader, feels like it could be done more functionally, and also matches the problem more intuitively I think. Meaning, we look at the cursor and expand outwards.
	- Hold on... I think that doesn't even make sense! The only way we really know that the form is top level is that its enclosing form is the document itself. So we really have to look at the whole thing.
	- So I have this:
	-
	  ```
	  		  (rest (read-string (str "(do " code ")")))
	  ```
	- It's a weird way of getting a list of all the top level forms.
	- With that, we can start at the cursor, and expand outward until it matches one of them
	- The only problem then is... what if there is a form inside another form that is the same as another one that is top level? hahaha
	- Anyway, that still seems like the best way, and then I'll patch up any edge cases afterwards
	- this works:
		-
		  ```
		  			  (require '[clojure.string :as str])
		  			  
		  			  (declare cm)
		  			  
		  			  (defn eval-string [s]
		  			    (when-some [code (not-empty (str/trim s))]
		  			      (try {:result (js/scittle.core.eval_string code)}
		  			           (catch js/Error e
		  			             {:error (str (.-message e))}))))
		  			  
		  			  (defonce last-result (atom ""))
		  			  (defonce eval-tail (atom nil))
		  			  
		  			  (defn update-editor! [text cursor-pos]
		  			    (let [end (count (some-> cm .-state .-doc str))]
		  			      (.dispatch cm #js{:changes #js{:from 0 :to end :insert text}
		  			                        :selection #js{:anchor cursor-pos :head cursor-pos}})))
		  			  
		  			  (defn parse-char [level pos]
		  			    (case pos
		  			      \( (inc level)
		  			      \) (dec level)
		  			      level))
		  			  
		  			  (defn form-at-cursor
		  			    "Takes the string of characters before cursor pos."
		  			    [s]
		  			    (let [run (rest (reductions parse-char 0 s))]
		  			      (->> s
		  			           (take (inc (count (take-while #(not= 0 %) run))))
		  			           reverse
		  			           (apply str))))
		  			  
		  			  (defn eval-at-cursor [viewer]
		  			    (let [cursor-pos (some-> cm .-state .-selection .-main .-head)
		  			          code (some-> cm .-state .-doc str)]
		  			      (let [region (form-at-cursor (reverse (take cursor-pos code)))
		  			            region (if (nil? region) nil (eval-string region))]
		  			        (if (nil? region) nil (reset! last-result region)))
		  			      (update-editor! (str (subs code 0 cursor-pos)
		  			                           (when-not (= "" (:result @last-result)) " => ")
		  			                           (:result @last-result)
		  			                           (reset! eval-tail (subs code cursor-pos (count code))))
		  			                      cursor-pos)
		  			      (.dispatch cm #js{:selection #js{:anchor cursor-pos :head   cursor-pos}}))
		  			    true)
		  			  
		  			  (defn code-str [s]
		  			    (str (rest (read-string (str "(do " s ")")))))
		  			  
		  			  (defn code-seq [s]
		  			    (map str (rest (read-string (str "(do " s ")")))))
		  			  
		  			  ;; but we really want to find the center points, not the start points.
		  			  
		  			  (defn find-center [[start s]]
		  			    [(+ start (int (/ (count s) 2))) s])
		  			  
		  			  ;; then just pick the one with the closest center point to the cursor,
		  			  ;; and evaluate it!
		  			  
		  			  (defn abs [v]
		  			    (if (neg? v) (- v) v))
		  			  
		  			  (defn top-level [s pos]
		  			    (first (nfirst
		  			            (sort-by #(abs (- pos (first %)))
		  			                     (map find-center
		  			                          (map vector
		  			                               (map #(str/last-index-of (code-str s) %) (code-seq s))
		  			                               (code-seq s)))))))
		  			  
		  			  (defn eval-top-level [viewer]
		  			    (let [code (some-> cm .-state .-doc str)
		  			          cursor-pos (some-> cm .-state .-selection .-main .-head)
		  			          result (reset! last-result (eval-string (top-level code cursor-pos)))]
		  			      (update-editor! (str (subs code 0 cursor-pos)
		  			                           (when-not (= "" (:result @last-result)) " => ")
		  			                           (:result result)
		  			                           (subs code cursor-pos))
		  			                      cursor-pos))
		  			    true)
		  			  
		  			  (defn eval-cell [viewer]
		  			    (let [code (some-> cm .-state .-doc str)]
		  			      (reset! last-result (eval-string (str "(do " (.-doc (.-state viewer)) " )")))
		  			      (update-editor! (str code
		  			                           (when-not (= "" (:result @last-result)) " => ")
		  			                           (:result @last-result))
		  			                      (count code)))
		  			    true)
		  			  
		  			  (defn clear-eval []
		  			    (let [code       (some-> cm .-state .-doc str)
		  			          cursor-pos (some-> cm .-state .-selection .-main .-head)
		  			          result     @last-result
		  			          splits     (str/split code #" => ")]
		  			      (when (not= "" @last-result)
		  			        (update-editor! (str (first splits) (subs (last splits) (count (str (:result result)))))
		  			                        cursor-pos)
		  			        (reset! last-result "")
		  			        (reset! eval-tail ""))))
		  			  
		  			  (def extension
		  			    (.of js/cv.keymap
		  			         (clj->js  [{:key (str "Alt-Enter")
		  			                     :run #(eval-cell %)}
		  			                    {:key  "Mod-Enter"
		  			                     :run #(eval-top-level %)}
		  			                    {:key "Shift-Enter"
		  			                     :run #(eval-at-cursor %)}
		  			                    {:key "Escape" :run clear-eval}
		  			                    {:key "ArrowLeft" :run clear-eval}
		  			                    {:key "ArrowRight" :run clear-eval}])))
		  			  
		  			  (def cm
		  			    (let [doc "(def n 7)
		  			  
		  			  (defn r []
		  			    (map inc (range n)))"]
		  			      (js/cm.EditorView. #js {:doc doc
		  			                              :extensions #js [js/cm.basicSetup, (js/lc.clojure), (.highest js/cs.Prec extension)]
		  			                              :parent (js/document.querySelector "#app")})))
		  			  
		  			  (set! (.-cm_instance js/globalThis) cm)
		  			  
		  ```
	- It actually works in a "fuzzy" way - it picks the form whose center point is nearest the cursor.
	- it's fuzzy in not the greatest way though... the positions are not precise because it's not counting the whitespace right since it is swallowed by the reader when we use it to separate the code into forms, but I'm thinking it might just work well enough.
	- The biggest issue right now is it puts the eval results where the cursor was, and we want it to be at the end of the form which isn't so easy to find. But it kind of works!
	- Well... it's almost 5am.
- # codemirror language module
	- Package and release it as an actual codemirror language module.
	- So I forked the Nextjournal one: https://github.com/bobbicodes/clojure-eval
	- Check out https://github.com/babashka/nbb#calling-nbb-from-javascript
	- That's exactly what I need!
	- but hmm... I guess I'm not sure if I can invoke nbb from typescript. Idk I'll keep trying.
	- ## Lezer parser - see lezer
	- Learning about LR parsers, which [Lezer](https://lezer.codemirror.net/docs/guide/) is.
		- The algorithm was designed by Donald Knuth in the paper On the Translation of Languages from Left to Right: https://pdf.sciencedirectassets.com/273276/1-s2.0-S0019995800X00186/1-s2.0-S0019995865904262/main.pdf
		- It basically means it goes left to right and does not require backtracking, instead it looks ahead.
		- Lezer is heavily influenced by tree-sitter.
		- This is the function that defines the parser grammar:
		-
		  ``` javascript
		  			  	  export const clojureLanguage = LRLanguage.define({
		  			  	    parser: parser.configure({
		  			  	      props: [styleTags({NS: tags.keyword,
		  			  	                         DefLike: tags.keyword,
		  			  	                         "Operator/Symbol": tags.keyword,
		  			  	                         "VarName/Symbol": tags.definition(tags.variableName),
		  			  	                         // Symbol: tags.keyword,
		  			  	                         // "'": tags.keyword, // quote
		  			  	                         Boolean: tags.atom,
		  			  	                         "DocString/...": tags.emphasis,
		  			  	                         "Discard!": tags.comment,
		  			  	                         Number: tags.number,
		  			  	                         StringContent: tags.string,
		  			  	                         "\"\\\"\"": tags.string, // need to pass something, that returns " when being parsed as JSON
		  			  	                         Keyword: tags.atom,
		  			  	                         Nil: tags.null,
		  			  	                         LineComment: tags.lineComment,
		  			  	                         RegExp: tags.regexp}),
		  			  	  
		  			  	              indentNodeProp.add((nodeType: NodeType) => {
		  			  	                return (context: TreeIndentContext) => {
		  			  	                  let {pos, unit, node, state, baseIndent, textAfter} = context
		  			  	                  if (nodeType.prop(coll)) {
		  			  	                    // same behaviour as in clojure-mode: args after operator are always 2-units indented
		  			  	                    let parentBase = context.column(node.firstChild.to) // column at the right of parent opening-(
		  			  	                    if ("List" == nodeType.name && ["NS", "DefLike", "Operator"].includes(node.firstChild.nextSibling.type.name)) {
		  			  	                      return parentBase + 1
		  			  	                    } else {
		  			  	                      return parentBase
		  			  	                    }
		  			  	                  } else {
		  			  	                    return 0
		  			  	                  }
		  			  	                }
		  			  	              }),
		  			  	  
		  			  	              foldNodeProp.add({["Vector Map List"]: foldInside})]}),
		  			  	  
		  			  	    languageData: {commentTokens: {line: ";;"}}})
		  ```
		- Beginning from the top, with `LRLanguage.define()` - from the `@codemirror/language` module.
- # What's stopping me from just...
	- compiling `clojure-mode` into javascript with `shadow-cljs`?
	- In the main Clojure project, I guess it was https://github.com/bobbicodes/typomaniac
	- I think the latest work was on the `scratch` branch, before I switched to scittle.
	- So this... is an Electron app. But the plugin obviously won't include the front end...
	- It will be something analogous to https://github.com/nextjournal/lang-clojure, which exports an `EditorView` object.
	- Since that's the plugin we were using with scittle, that's the same way we can test the one we make here. I'm pretty sure this can work. We're just using Clojurescript instead of Typescript.
	- This is the key bit, at the bottom of `codemirror.cljs`:
	-
	  ``` clojure
	  		  (def cm
	  		    (let [doc ""]
	  		      (js/cm.EditorView. #js {:doc doc
	  		                              :extensions #js [js/cm.basicSetup, (js/lc.clojure), (.highest js/cs.Prec extension)]
	  		                              :parent (js/document.querySelector "#app")})))
	  		  
	  		  (set! (.-cm_instance js/globalThis) cm)
	  ```
	- So we just define the `EditorView` object, and set the `.-cm_instance` property to it.
	- hmm it might be good to look at how exactly it's wired up in Exercism, with another language package like `@codemirror/lang-javascript`
	- So it starts in `CodeMirror.tsx`:
	-
	  ``` js
	  		  const view = new EditorView({
	  		        state: EditorState.create({
	  		          doc: value,
	  		          extensions: [
	  		            keymapCompartment.of(keymap.of(commands)),
	  		            basicSetup,
	  		            a11yTabBindingPanel(),
	  		            tabCaptureCompartment.of(
	  		              keymap.of(isTabCaptured ? [tabBinding] : [])
	  		            ),
	  		            indentUnit.of(indentChar),
	  		            wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
	  		            themeCompartment.of(
	  		              theme === Themes.LIGHT
	  		                ? [defaultHighlightStyle]
	  		                : [oneDarkTheme, oneDarkHighlightStyle]
	  		            ),
	  		            readonlyCompartment.of([EditorView.editable.of(!readonly)]),
	  		          ],
	  		        }),
	  		        parent: textarea,
	  		      })
	  		  
	  		      viewRef.current = view
	  		  
	  		      editorDidMount({ setValue, getValue, focus: view.focus.bind(view) })
	  		  
	  		      // Lazy-load the language extension, which allows us to import just
	  		      // the extension's code for the current language
	  		      loadLanguageCompartment(language).then((languageExtension) => {
	  		        view.dispatch({
	  		          effects: StateEffect.appendConfig.of(languageExtension),
	  		        })
	  		      })
	  		    })
	  ```
	- that loads the language extension, imported from `languageCompartment.ts`, which is basically just a `case` statement:
	-
	  ``` js
	  		  case 'clojure':
	  		      case 'clojurescript': {
	  		        const { clojure } = await import('@codemirror/legacy-modes/mode/clojure')
	  		        return compartment.of(StreamLanguage.define(clojure))
	  		      }
	  ```
	- Clojure is currently a `legacy-mode`, but this will be like the js plugin:
	-
	  ``` js
	  		  case 'javascript':
	  		      case 'typescript': {
	  		        const { javascript } = await import('@codemirror/lang-javascript')
	  		        return compartment.of(javascript())
	  		      }
	  ```
	- In other words, we're not going to use `StreamLanguage` anymore.
	- So then we turn to `javascript.ts` from the js plugin, which is analogous to the `clojure.ts` from the Nextjournal package. This imports and modifies the `EditorView` object, specifically the `inputHandler` to insert JSX close tags when a `>` or `/` is typed, exporting a `autoCloseTags` const.
	- So I already told the team in the maintaining thread that the package will live at https://github.com/bobbicodes/clojure-eval
	- # 4/25
	- So... what does this snippet, from the Exercism website do?
	-
	  ``` clojure
	  		  case 'clojure':
	  		      case 'clojurescript': {
	  		        const { clojure } = await import('@codemirror/legacy-modes/mode/clojure')
	  		        return compartment.of(StreamLanguage.define(clojure))
	  		      }
	  ```
	- It's just like `compartment.of(javascript())`.
	- ## What is `compartment`?
	-
	  ``` js
	  		  import { Compartment, Extension } from '@codemirror/state'
	  		  const compartment = new Compartment()`
	  ```
	- `@codemirror/state`. I haven't looked at that much yet.
	- ### Codemirror reference entry
	- #### class Compartment
		- Extension compartments can be used to make a configuration dynamic. By wrapping part of your configuration in a compartment, you can later replace that part through a transaction.
		- of(ext: Extension) → Extension
		  Create an instance of this compartment to add to your state configuration.
		- reconfigure(content: Extension) → StateEffect<unknown>
		  Create an effect that reconfigures this compartment.
		- get(state: EditorState) → Extension | undefined
		  Get the current content of the compartment in the state, or undefined if it isn't present.
	- So, `return compartment.of(StreamLanguage.define(clojure))` creates an instance of a dynamic state compartment.
	- Then what is `StreamLanguage.define(clojure)`?
	- `import { StreamLanguage } from '@codemirror/stream-parser'`
	- Do we need to do that? The lang-clojure package uses `LanguageSupport` from `@codemirror/language`.
	- This is also imported, in `CodeMirror.tsx`:
	-
	  ``` js
	  		  import { indentUnit } from '@codemirror/language'
	  ```
	- Let's pull this apart. here is where the Exercism EditorView is instantiated:
	-
	  ``` js
	  		  useEffect(() => {
	  		      if (!textarea) {
	  		        return
	  		      }
	  		  
	  		      if (viewRef.current) {
	  		        return
	  		      }
	  		  
	  		      const view = new EditorView({
	  		        state: EditorState.create({
	  		          doc: value,
	  		          extensions: [
	  		            keymapCompartment.of(keymap.of(commands)),
	  		            basicSetup,
	  		            a11yTabBindingPanel(),
	  		            tabCaptureCompartment.of(
	  		              keymap.of(isTabCaptured ? [tabBinding] : [])
	  		            ),
	  		            indentUnit.of(indentChar),
	  		            wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
	  		            themeCompartment.of(
	  		              theme === Themes.LIGHT
	  		                ? [defaultHighlightStyle]
	  		                : [oneDarkTheme, oneDarkHighlightStyle]
	  		            ),
	  		            readonlyCompartment.of([EditorView.editable.of(!readonly)]),
	  		          ],
	  		        }),
	  		        parent: textarea,
	  		      })
	  		  
	  		      viewRef.current = view
	  		  
	  		      editorDidMount({ setValue, getValue, focus: view.focus.bind(view) })
	  		  
	  		      // Lazy-load the language extension, which allows us to import just
	  		      // the extension's code for the current language
	  		      loadLanguageCompartment(language).then((languageExtension) => {
	  		        view.dispatch({
	  		          effects: StateEffect.appendConfig.of(languageExtension),
	  		        })
	  		      })
	  		    })
	  ```
	- So the very last part is important. We dispatch a `StateEffect`.
- # Codemirror doc
	- So this is really good: https://codemirror.net/examples/lang-package/
	- The `lang-javascript` package Includes snippet completion. This might demonstrate where we need to dispatch the state.
	- Hmm this is handled by `@codemirror/autocomplete`:
	-
	  ``` js
	  		  export function applyCompletion(view: EditorView, option: Option) {
	  		    const apply = option.completion.apply || option.completion.label
	  		    let result = option.source
	  		    if (typeof apply == "string")
	  		      view.dispatch({
	  		        ...insertCompletionText(view.state, apply, result.from, result.to),
	  		        annotations: pickedCompletion.of(option.completion)
	  		      })
	  		    else
	  		      apply(view, option.completion, result.from, result.to)
	  		  }
	  ```
- # Shadow-cljs
	- So I think I'm going to set the build target to node?
	-
	  > Each build will have a :target property which represents a configuration preset optimized for the target environment (eg. the Browser, a node.js application or a Chrome Extension).

	- That is what I want, right? Yes normally the target is the browser.But here we are making a node application.
	- https://shadow-cljs.github.io/docs/UsersGuide.html#target-npm-module
	- So we need to `return compartment.of(clojure())`
	- `clojure()` is what is imported from our lib.
	- See... we are not exporting the EditorView I think... that was how it worked with scittle.
	- This is the language support export for js:
	-
	  ``` js
	  		  export function javascript(config: {jsx?: boolean, typescript?: boolean} = {}) {
	  		    let lang = config.jsx ? (config.typescript ? tsxLanguage : jsxLanguage)
	  		      : config.typescript ? typescriptLanguage : javascriptLanguage
	  		    return new LanguageSupport(lang, [
	  		      javascriptLanguage.data.of({
	  		        autocomplete: ifNotIn(dontComplete, completeFromList(snippets.concat(keywords)))
	  		      }),
	  		      javascriptLanguage.data.of({
	  		        autocomplete: localCompletionSource
	  		      }),
	  		      config.jsx ? autoCloseTags : [],
	  		    ])
	  		  }
	  ```
	- So we need to create a `LanguageSupport` object. This comes from `@codemirror/language`.
	- This part in the codemirror doc above is the key:
	-
	  > Finally, it is convention for language packages to export a main function (named after the language, so it's called css in @codemirror/lang-css for example) that takes a configuration object (if the language has anything to configure) and returns a LanguageSupport object, which bundles a Language instance with any additional supporting extensions that one might want to enable for the language.

	-
	  ``` js
	  		  import {LanguageSupport} from "@codemirror/language"
	  		  
	  		  export function example() {
	  		    return new LanguageSupport(exampleLanguage, [exampleCompletion])
	  		  }
	  ```
	- `exampleCompletion` was defined above, but we will instead be using our evaluation extension.
	- So there we have it. Just need to study this all some more to wrap my head around it.
	- Check out the section of the reference on `LanguageSupport`: https://codemirror.net/docs/ref/#language.LanguageSupport
	- ## class LanguageSupport
	- This class bundles a language with an optional set of supporting extensions. Language packages are encouraged to export a function that optionally takes a configuration object and returns a LanguageSupport instance, as the main way for client code to use the package.
	- `new LanguageSupport(language: Language, support⁠?: Extension = [])`
	  Create a language support object.
	- `extension: Extension`
	  An extension including both the language and its support extensions. (Allowing the object to be used as an extension value itself.)
	- `language: Language`
	  The language object.
	- `support: Extension`
	  An optional set of supporting extensions. When nesting a language in another language, the outer language is encouraged to include the supporting extensions for its inner languages in its own set of support extensions.
	- ok cool, I think I just cracked the architecture! So this is the export in `lang-clojure`:
	-
	  ``` js
	  		  export function clojure() {
	  		    return new LanguageSupport(clojureLanguage)
	  		  }
	  ```
	- Where in the example package above, it looks like this:
	-
	  ``` js
	  		  export function example() {
	  		    return new LanguageSupport(exampleLanguage, [exampleCompletion])
	  		  }
	  ```
	- So where `exampleCompletion` is, is where our extension is exported from the shadow-cljs library!
	- Let me commit that.
- # Demo screencast
	- Jeremy asked if I could put together a Loom or similar. It should give a little tour of the code and show it working. But right now, all I know is that it builds and the linter doesn't complain that a variable doesn't exist. So what I need to do is put together a minimal version of the Codemirror editor as close as possible to the way it is used in the Exercism app.
	- Got it working! Much faster than I thought I would! There's still a few bugs, like I want to make more keys clear the evaluation results but the Enter key is doing strange behavior when I disable the current command connected to it, which is `enter-and-indent*` in the `nextjournal\clojure_mode\commands.cljs` file. I might end up refactoring the commands and trying to come up with a simpler system.
	- A more important issue is that it doesn't output the right thing, I think. It's not doing anything like the `LanguageSupport` thing in `clojure.ts`, actually it's not using that file at all I think.
	- The original `main.js` has this at the bottom:
	-
	  ``` js
	  		  new EditorView({
	  		    doc: doc,
	  		    extensions: [basicSetup, clojure()],
	  		    parent: document.querySelector('#app')
	  		  }).focus()
	  ```
	- The `clojure()` function is output from `clojure.ts`.
	- However, our version has `inlineEval(doc).focus()`, which comes from our Clojurescript.
	- We don't actually *need* `clojure.ts`, as long as we export the `clojure()` function:
	-
	  ``` js
	  		  export function clojure() {
	  		      return new LanguageSupport(clojureLanguage)
	  		    }
	  ```
	- `LanguageSupport` is an `LRLanguage`. We have that, in `src\nextjournal\clojure_mode.cljs`:
	-
	  ``` clojure
	  		  (def language-support
	  		    "Eases embedding clojure mode into other languages (e.g. markdown).
	  		    See https://codemirror.net/docs/ref/#language.LanguageSupport for motivations"
	  		    (LanguageSupport. (syntax) (.. default-extensions (slice 1))))
	  ```
	- yeah, I think that's what we want! So we should be able to just do this in`editor.cljs`:
	-
	  ``` clojure
	  		  (defn clojure []
	  		    cm-clj/language-support)
	  ```
	- And export it by including it in the `shadow-cljs` build:
	-
	  ``` clojure
	  		  {:app {:asset-path  "/js"
	  		                        :output-dir  "src"
	  		                        :target      :esm
	  		                        :exports-var cloju	re-eval.editor/inlineEval
	  		                        :modules     {:eval {:exports {inlineEval clojure-eval.editor/inlineEval
	  		                                                       clojure clojure-eval.editor/clojure}}}}}
	  ```
- # Starting over with a fresh one
	- I burned out on it because I hate JavaScript
	- Starting with a fresh fork of https://github.com/nextjournal/lang-clojure
	- learning about lezer
- # Vite demo
	- Repo: https://github.com/bobbicodes/lang-clojure-eval
	- It's currently the same as lang-clojure but in js instead of typescript, with a demo app using Vite.
	- ## Analyzing [main.js](https://github.com/bobbicodes/lang-clojure-eval/blob/main/main.js)
	- This is the `clojureLanguage` definition:
	-
	  ``` js
	  		  export const clojureLanguage = LRLanguage.define({
	  		    parser: parser.configure({
	  		      props: [styleTags({
	  		        NS: tags.keyword,
	  		        DefLike: tags.keyword,
	  		        "Operator/Symbol": tags.keyword,
	  		        "VarName/Symbol": tags.definition(tags.variableName),
	  		        // Symbol: tags.keyword,
	  		        // "'": tags.keyword, // quote
	  		        Boolean: tags.atom,
	  		        "DocString/...": tags.emphasis,
	  		        "Discard!": tags.comment,
	  		        Number: tags.number,
	  		        StringContent: tags.string,
	  		        "\"\\\"\"": tags.string, // need to pass something, that returns " when being parsed as JSON
	  		        Keyword: tags.atom,
	  		        Nil: tags.null,
	  		        LineComment: tags.lineComment,
	  		        RegExp: tags.regexp
	  		      }),
	  		  
	  		      indentNodeProp.add((nodeType) => {
	  		        return (context) => {
	  		          let { pos, unit, node, state, baseIndent, textAfter } = context
	  		          if (nodeType.prop(coll)) {
	  		            // same behaviour as in clojure-mode: args after operator are always 2-units indented
	  		            let parentBase = context.column(node.firstChild.to) // column at the right of parent opening-(
	  		            if ("List" == nodeType.name && ["NS", "DefLike", "Operator"].includes(node.firstChild.nextSibling.type.name)) {
	  		              return parentBase + 1
	  		            } else {
	  		              return parentBase
	  		            }
	  		          } else {
	  		            return 0
	  		          }
	  		        }
	  		      }),
	  		  
	  		      foldNodeProp.add({ ["Vector Map List"]: foldInside })]
	  		    }),
	  		  
	  		    languageData: { commentTokens: { line: ";;" } }
	  		  })
	  ```
	- It calls `LRLanguage.define`. What is that? It's defined in https://github.com/codemirror/language/blob/4c2074c52eb2b3f23b2e6b59e02b910ec59a5ce7/src/language.ts#L168:
	-
	  ``` typescript
	  		  /// A subclass of [`Language`](#language.Language) for use with Lezer
	  		  /// [LR parsers](https://lezer.codemirror.net/docs/ref#lr.LRParser)
	  		  /// parsers.
	  		  export class LRLanguage extends Language {
	  		    private constructor(data: Facet<{[name: string]: any}>, readonly parser: LRParser, name?: string) {
	  		      super(data, parser, [], name)
	  		    }
	  		  
	  		    /// Define a language from a parser.
	  		    static define(spec: {
	  		      /// The [name](#Language.name) of the language.
	  		      name?: string,
	  		      /// The parser to use. Should already have added editor-relevant
	  		      /// node props (and optionally things like dialect and top rule)
	  		      /// configured.
	  		      parser: LRParser,
	  		      /// [Language data](#state.EditorState.languageDataAt)
	  		      /// to register for this language.
	  		      languageData?: {[name: string]: any}
	  		    }) {
	  		      let data = defineLanguageFacet(spec.languageData)
	  		      return new LRLanguage(data, spec.parser.configure({
	  		        props: [languageDataProp.add(type => type.isTop ? data : undefined)]
	  		      }), spec.name)
	  		    }
	  		  
	  		    /// Create a new instance of this language with a reconfigured
	  		    /// version of its parser and optionally a new name.
	  		    configure(options: ParserConfig, name?: string): LRLanguage {
	  		      return new LRLanguage(this.data, this.parser.configure(options), name || this.name)
	  		    }
	  		  
	  		    get allowsNesting() { return this.parser.hasWrappers() }
	  		  }
	  ```
	- So we are defining a language from a parser. It is passed an object with a `parser` key, which calls `parser.configure` which is passed another object consisting of the keys `props` and `languageData`.
	- ## Analyzing nextjournal/clojure-mode
	- I think it might help me to inspect the clojure version of this to get a better idea of how this works. Let's see if we can find it.
	- From `clojure_mode.cljs`:
	- We define `fold-node-props`, which is included in our call to `LRLanguage` in the `props` key.
	- We have `style-tags`. So far nothing is relevant to our problem at hand, which is the `eval-region` extension.
	- We have the parser object. And we have `syntax` which defines the `LRLanguage` and configures the parser with the `props`, `format/props`, `fold-node-props`, and the style-tags which are highlighting information, and we have a `complete-keymap` of bindings.
	- All these things defined above are then put in our `default-extensions` array that goes into our `EditorView`. Simple!
	-
	  ``` js
	  		  (def default-extensions
	  		    #js[(syntax lezer-clj/parser)
	  		        (close-brackets/extension)
	  		        (match-brackets/extension)
	  		        (sel-history/extension)
	  		        (format/ext-format-changed-lines)
	  		        (eval-region/extension {:modifier "Alt"})])
	  ```
	- So now that we know that `eval-region` is simply an extension that lives in its own namespace (actually I knew that already but it's not like that means anything here), let's have a look at that, and perhaps translate it into JavaScript to add into the vite project.
- # Eval region
	- So here we come to the real substantial piece. It is quite substantial, so we should put it in its own file and try to link it and build it up. I think I'm finally getting somewhere!
	- This is our first function, `uppermost-edge-here`:
	-
	  ``` clojure
	  		  (defn uppermost-edge-here
	  		    "Returns node or its highest ancestor that starts or ends at the cursor position."
	  		    [pos node]
	  		    (or (->> (iterate n/up node)
	  		             (take-while (every-pred (complement n/top?)
	  		                                     #(or (= pos (n/end %) (n/end node))
	  		                                          (= pos (n/start %) (n/start node)))))
	  		             (last))
	  		        node))
	  ```
	- So it takes a cursor position and a node, and goes up until we reach a node which is not the top, but either, uh, well we need to dig into another namespace for `n/up`, `n/top?`, `n/start` and `n/end`. There's also a `util` namespace which we'll need later, but one step at a time.
	- Let me translate the above function to make it more straightforward.
	- Well, actually it makes more sense as it is. `(iterate n/up node)` creates an infinite sequence, but that's probably not the way to do it,, we need to think more imperatively.
	- The `n/up` function is a zipper-like interface:
	-
	  ``` clojure
	  		  (defn ^js up [node] (.-parent ^js node))
	  ```
	- So it just takes a node and returns its `parent` property.
	-
	  ``` js
	  		  function up(node) {
	  		      return node.parent;
	  		  }
	  ```
	-
	  ``` clojure
	  		  (defn ^boolean top-type? [node-type] (.-isTop ^js node-type))
	  		  (defn top? [node] (top-type? (type node)))
	  ```
	- How do we get the type of the node? is it like the `typeOf` property or something? I need to like, print one to the console or something.
	- I guess all the functions take the `EditorState`. How do we access that?
	- I had to do this:
	-
	  ``` javascript
	  		  let state = EditorState.create({
	  		    doc: `(map inc (range 8))`,
	  		    extensions: [basicSetup, clojure()]
	  		  })
	  		  
	  		  new EditorView({
	  		    state: state,
	  		    parent: document.querySelector('#app')
	  		  }).focus()
	  ```
	- I can now print the state to the console. Phew!
	- So we need to get the nodes from the state. We have this:
	-
	  ``` clojure
	  		  (defn |node
	  		    "Node starting immediately to the right of pos"
	  		    [state pos]
	  		    (some-> (tree state pos 1)
	  		            (u/guard #(= pos (start %)))))
	  ```
	- ok, what is tree?
	-
	  ``` clojure
	  		  (defn ^js tree
	  		    "Returns a (Tree https://lezer.codemirror.net/docs/ref/#common.Tree) for editor state
	  		    or the SyntaxNode at pos.
	  		  
	  		    If pos is given and we're using Clojure language support embedded in other languages (e.g. markdown)
	  		    enters overlaid Clojure nodes (https://lezer.codemirror.net/docs/ref/#common.MountedTree)."
	  		    ([^js state] (language/syntaxTree state))
	  		    ([^js state pos] (-> state language/syntaxTree (.resolveInner pos)))
	  		    ([^js state pos dir] (-> state language/syntaxTree (.resolveInner pos dir))))
	  ```
	- So we have to use `syntaxTree` from `@codemirror/language`.
	- This is great! Now I'm finally rolling!
	- Here's the `tree` function:
	-
	  ``` js
	  		  function tree(state, pos, dir) {
	  		    switch (arguments["length"]) {
	  		      case 1:
	  		        return syntaxTree(state);
	  		      case 2:
	  		        return syntaxTree(state).resolveInner(pos);
	  		      case 3:
	  		        return syntaxTree(state).resolveInner(pos, dir);
	  		    }
	  		  }
	  ```
	-
	  ``` clojure
	  		  (defn ^number start [^js node]
	  		    {:pre [(.-from node)]}
	  		    (.-from node))
	  ```
	- Wait, so what are we trying to do? I guess we need to track back the function that evaluates at the cursor:
	-
	  ``` clojure
	  		  (defn cursor-node-string [^js state]
	  		    (u/guard (some->> (node-at-cursor state)
	  		                      (u/range-str state))
	  		             (complement str/blank?)))
	  ```
	- So we need `node-at-cursor`:
	-
	  ``` clojure
	  		  (defn node-at-cursor
	  		    ([state] (node-at-cursor state (j/get (main-selection state) :from)))
	  		    ([^js state from]
	  		     (some->> (n/nearest-touching state from -1)
	  		              (#(when (or (n/terminal-type? (n/type %))
	  		                          (<= (n/start %) from)
	  		                          (<= (n/end %) from))
	  		                  (cond-> %
	  		                    (or (n/top? %)
	  		                        (and (not (n/terminal-type? (n/type %)))
	  		                             (< (n/start %) from (n/end %))))
	  		                    (-> (n/children from -1) first))))
	  		              (uppermost-edge-here from)
	  		              (n/balanced-range state))))
	  ```
- # Eval
	- So how is this actually going to work? SCI works in the Clojurescript version but we are now in Javascript. Do I need to like, compile it or something? I wonder if that... yes, it should definitely work...
	- What about this: https://github.com/babashka/nbb#calling-nbb-from-javascript
	-
	  ``` js
	  		  import { loadString } from 'nbb'
	  ```
	- It seems that this doesn't work in the browser because it's compiled for node. I think that means I'll need to compile my own.
	- Omg I think I am... but the reason it doesn't work is because it calls `js/process`. I know this because the browser reports a `Uncaught ReferenceError: process is not defined` and points to the file.
	- This seems pretty much baked into the node runtime. So what I'll need to do is compile my own from regular sci, and I can use nbb as a guide. I can learn a hell of a lot by studying this stuff!
- omg I'm getting eepy. next time what I want to do is turn the vite project into a shadow project. I can just depend on SCI, and it will be much like `clojure-mode`. Which is, ironically, the same thing I was trying before but hopefully this time I will figure it out.
- # Holy shit, this is a doozy
	- Still struggling with this. Took me forever to get a working shadow-cljs project. The shitty part is I don't really know what the problem was... but even my shadow-reagent project stopped working on Windows (yet works in wsl), but for some reason the `create-cljs-app` thing works!
	- So it now lives at https://github.com/bobbicodes/codemirror-shadow.
	- It also contains the demo Vite app, so we're at parity with what we had before.
	- I even brought over the entire eval-region extension from Clojure-mode, compiled it... and it doesn't work. It actually gives the same error that I've run into before, about there being an unrecognized extension... if I could make a minimal repro of this I can ask on Slack, I'm sure Thomas Heller will help!
	- One angle I just thought of that I haven't exhausted yet is the key bindings. It would be cool to see if we can wire that up, and just have it print to the console when the commands are activated.
	- I'd like to get a better development feedback loop going. If I have shadow output to a directory that can be imported by the vite app, it will update whenever it recompiles. Tits!
	- Blah. I'm already stuck. I guess I'll start over...
	- I have the feedback loop. I'll make a commit, like "hot-reload clojurescript into Vite app"
	- The problem is... I can't load `@codemirror/language` or it borks with "Uncaught Error: Namespace "shadow.js" already declared."
	- Blah... Let's fucking start all over again...
	- `npx create-cljs-project acme-app`
	- I just happened to see right in the shadow user guide that codemirror only works when targeting the browser. How interesting... so I guess what I need to do is just use it to compile SCI, then do the codemirror shit in straight js... ok so we'll hop back over to the `lang-clojure-eval` project and work on that a bit...
	- So if I simply constrain the evaluation problem to "eval-cell" then we won't have to do any parsing, and I can just worry about setting up a command to pass the editor contents to my hopefully soon to be compiled sci js module. That will cover a very significant piece without tons of code, and I'll have at least gotten somewhere. god, this is the hardest problem I've ever attempted, and it seems so simple.
	- omg it works! that was actually super easy! now I don't have to worry about the evaluation shit! baby we did it!
	- It's only 796 KB too.
- # Eval cell
	- So this is the simplest path to get something working.
	-
	  ``` clojure
	  		  (j/defn eval-cell [on-result ^:js {:keys [state]}]
	  		    (-> (.-doc state)
	  		        (str)
	  		        (eval-string)
	  		        (on-result))
	  		    true)
	  ```
	- So presumably we can get the `doc` from the editor state. Done!
	- I guess the next thing is to make a command and hook it up to an actual key binding. Right now it's just evaluating the initial doc at page load and printing the result to the console. Still cool!
	- wait... so what `state.doc.text[0]` does is give us the first line. We need to concatenate all of them.
	-
	  ``` js
	  		  function evalCell() {
	  		    return evalString(state.doc.text.join(" "))
	  		  }
	  ```
	- Now we turn to the keybinding, which is in `@codemirror/view.keymap`.
	- This is documented right [here](https://codemirror.net/docs/ref/):
	-
	  ``` js
	  		  import {EditorView, keymap} from "@codemirror/view"
	  		  import {defaultKeymap} from "@codemirror/commands"
	  		  
	  		  let myView = new EditorView({
	  		    doc: "hello",
	  		    extensions: [keymap.of(defaultKeymap)],
	  		    parent: document.body
	  		  })
	  ```
	- We call `keymap.of` and pass it an object:
	-
	  ``` js
	  		  [{key: "Mod-Enter"
	  		    run: evalCell(onResult)}]
	  ```
	- OMG I got it! That was a bitch, but it seems pretty obvious now...
	- It fucking works. I'd say I accomplished quite a bit today! I made the sci evaluator and hooked it up to a command and key binding.
	- The trick was figuring out that the function set to the run command in the keymap is passed the editorView object. How was I supposed to know that? It doesn't seem to be documented anywhere. The view object has a `state` property which contains the current editor doc, and is accessed and evaluated like this:
	-
	  ``` js
	  		  evalString(view.state.doc.text.join(" "))
	  ```
	- What I don't understand is, how to make the Alt key work. Ctrl also doesn't work. why does shift work then?
	- Figured it out. It's because Ctrl+Enter is bound to something else in the `basicSetup` extension. The solution is to use the `Prec` (Precedence) function:
	-
	  ``` js
	  		  function evalExtension() {
	  		    return Prec.highest(keymap.of([{
	  		      key: "Ctrl-Enter",
	  		      run: printResult
	  		    }]))
	  		  }
	  ```
- # Eval at cursor
	- Alright, so evaluating the entire cell was the easy part because we didn't have to parse anything, we just concatenated the lines and evaluated it. Now the fun continues! I figure eval-at-cursor will be the next command to attack.
	- In clojure-mode this is handled by a function called `cursor-node-string` in the `eval-region` namespace:
	-
	  ``` clojure
	  		  (defn cursor-node-string [^js state]
	  		    (u/guard (some->> (node-at-cursor state)
	  		                      (u/range-str state))
	  		             (complement str/blank?)))
	  ```
	- So we need `node-at-cursor`:
	-
	  ``` clojure
	  		  (defn node-at-cursor
	  		    ([state] (node-at-cursor state (j/get (main-selection state) :from)))
	  		    ([^js state from]
	  		     (some->> (n/nearest-touching state from -1)
	  		              (#(when (or (n/terminal-type? (n/type %))
	  		                          (<= (n/start %) from)
	  		                          (<= (n/end %) from))
	  		                  (cond-> %
	  		                    (or (n/top? %)
	  		                        (and (not (n/terminal-type? (n/type %)))
	  		                             (< (n/start %) from (n/end %))))
	  		                    (-> (n/children from -1) first))))
	  		              (uppermost-edge-here from)
	  		              (n/balanced-range state))))
	  ```
	- It now returns the nearest touching node but haven't implemented `node-at-cursor` beyond that. This is now being passed straight to `cursorNodeString`.
	- We need `terminal-type?`:
	-
	  ``` clojure
	  		  (defn terminal-type? [^js node-type]
	  		    (cond (top-type? node-type) false
	  		          (.prop node-type prefix-coll-prop) false
	  		          (.prop node-type coll-prop) false
	  		          (identical? "Meta" (name node-type)) false
	  		          (identical? "TaggedLiteral" (name node-type)) false
	  		          (identical? "ConstructorCall" (name node-type)) false
	  		          :else true))
	  ```
	- Now `children`, this looks important
	-
	  ``` clojure
	  		  (defn children
	  		    ([^js parent from dir]
	  		     (when-some [^js child (case dir 1 (.childAfter parent from)
	  		                                     -1 (.childBefore parent from))]
	  		       (cons child (lazy-seq
	  		                    (children parent (case dir 1 (end child)
	  		                                               -1 (start child)) dir)))))
	  ```
	-
	- Let's first knock out `main-selection`:
	-
	  ``` clojure
	  		  (defn main-selection [state]
	  		    (-> (j/call-in state [:selection :asSingle])
	  		        (j/get-in [:ranges 0])))
	  ```
	- Weird... for some strange reason I like the JavaScript version better
	-
	  ``` js
	  		  function mainSelection(state) {
	  		    return state.selection.asSingle().ranges[0]
	  		  }
	  ```
	- Next we need `nearest-touching`:
	-
	  ``` clojure
	  		  (defn nearest-touching [^js state pos dir]
	  		    (let [L (some-> (tree state pos -1)
	  		                    (u/guard (j/fn [^:js {:keys [to]}] (= pos to))))
	  		          R (some-> (tree state pos 1)
	  		                    (u/guard (j/fn [^:js {:keys [from]}]
	  		                               (= pos from))))
	  		          mid (tree state pos)]
	  		      (case dir 1 (or (u/guard R (every-pred some? #(or (same-edge? %) (not (right-edge? %)))))
	  		                      L
	  		                      R
	  		                      mid)
	  		            -1 (or (u/guard L (every-pred some? #(or (same-edge? %) (not (left-edge? %)))))
	  		                   R
	  		                   L
	  		                   mid))))
	  ```
	- So this defines `L`, `R` and `mid`. Fortunately I already ported the `tree` function.
	- These make heavy use of the `guard` function:
	-
	  ``` clojure
	  		  (defn guard [x f] (when (f x) x))
	  ```
	- It just takes a value and a function, and simply returns the *value* *if* calling the function on it returns true, otherwise nil. So it "guards" against returning a non-value.
	- I think I'll just use regular conditionals in the js for the `some->` macros, guards, etc.
	- I'm first writing the above as skeleton functions so we get some output.
	-
	  ``` clojure
	  		  (j/defn range-str [state ^:js {:as selection :keys [from to]}]
	  		    (str (j/call-in state [:doc :slice] from to)))
	  ```
	- `uppermost-edge-here`:
	-
	  ``` clojure
	  		  (defn uppermost-edge-here
	  		    "Returns node or its highest ancestor that starts or ends at the cursor position."
	  		    [pos node]
	  		    (or (->> (iterate n/up node)
	  		             (take-while (every-pred (complement n/top?)
	  		                                     #(or (= pos (n/end %) (n/end node))
	  		                                          (= pos (n/start %) (n/start node)))))
	  		             (last))
	  		        node))
	  ```
	- ## I "cheated"!
		- managed to use shadow to compile the clojure-mode node namespace, and it works perfectly! The only catch atm is... I had to start a new shadow project to do it for some unknown reason... seems like a dependency conflict or something. But I'm glad I stuck it out and did this because it saves me so much work!
		- I'll have to figure this out later, but in the meantime I should check the second shadow project into version control. I'll call it lezer-shadow. Because it uses shadow-cljs, and because I'm "shadowing" clojure-mode!
		- I'll also put a note in the main project readme, actually in a development section.
		- But wait... for some reason, when I try to build the project, the nodes namespace breaks! I have no idea why, and I spent all day trying it like 3 times. I guess I'm going to have to go back to translating it to javascript myself... Well I guess I'm just glad that the sci part works because I would NOT be translating that...
		- The good part is, I got pretty far last night! I really just need to finish `nearestTouching` and `nodeAtCursor`. Though they're the most complicated ones, I can break them up if I want. Let's do it!
	- ## `nearestTouching`
		- This kind of works, I think.
		-
		  ``` clojure
		  			  (defn nearest-touching [^js state pos dir]
		  			    (let [L (some-> (tree state pos -1)
		  			                    (u/guard (j/fn [^:js {:keys [to]}] (= pos to))))
		  			          R (some-> (tree state pos 1)
		  			                    (u/guard (j/fn [^:js {:keys [from]}]
		  			                               (= pos from))))
		  			          mid (tree state pos)]
		  			      (case dir 1 (or (u/guard R (every-pred some? #(or (same-edge? %) (not (right-edge? %)))))
		  			                      L
		  			                      R
		  			                      mid)
		  			            -1 (or (u/guard L (every-pred some? #(or (same-edge? %) (not (left-edge? %)))))
		  			                   R
		  			                   L
		  			                   mid))))
		  ```
		- The thing is, it's only called twice ever:
		-
		  ``` clojure
		  			  (defn node-at-cursor
		  			    ([state] (node-at-cursor state (j/get (main-selection state) :from)))
		  			    ([^js state from]
		  			     (some->> (n/nearest-touching state from -1)
		  			              (#(when (or (n/terminal-type? (n/type %))
		  			                          (<= (n/start %) from)
		  			                          (<= (n/end %) from))
		  			                  (cond-> %
		  			                    (or (n/top? %)
		  			                        (and (not (n/terminal-type? (n/type %)))
		  			                             (< (n/start %) from (n/end %))))
		  			                    (-> (n/children from -1) first))))
		  			              (uppermost-edge-here from)
		  			              (n/balanced-range state))))
		  			  
		  			  (defn top-level-node [state]
		  			    (->> (n/nearest-touching state (j/get (main-selection state) :from) -1)
		  			         (iterate n/up)
		  			         (take-while (every-pred identity (complement n/top?)))
		  			         last))
		  ```
		- As we can see, it's always called with `-1` as the third arg. Which means we can simplify it already:
		-
		  ``` clojure
		  			  (defn nearest-touching [^js state pos]
		  			    (let [L (some-> (tree state pos -1)
		  			                    (u/guard (j/fn [^:js {:keys [to]}] (= pos to))))
		  			          R (some-> (tree state pos 1)
		  			                    (u/guard (j/fn [^:js {:keys [from]}]
		  			                               (= pos from))))
		  			          mid (tree state pos)]
		  			      (or (u/guard L (every-pred some? #(or (same-edge? %) (not (left-edge? %)))))
		  			          R
		  			          L
		  			          mid)))
		  ```
		- Yeah, I think this one is good, actually.
	- ## `nodeAtCursor`
	- Assuming `nearestTouching` works, now we have this nasty part:
	-
	  ``` clojure
	  		  (#(when (or (n/terminal-type? (n/type %))
	  		                          (<= (n/start %) from)
	  		                          (<= (n/end %) from))
	  		                  (cond-> %
	  		                    (or (n/top? %)
	  		                        (and (not (n/terminal-type? (n/type %)))
	  		                             (< (n/start %) from (n/end %))))
	  		                    (-> (n/children from -1) first)))
	  		    (n/nearest-touching state from -1))
	  ```
	- It's checking whether we need to take not the node itself but its first child, like forms that have prefixes like meta (`^`), (`#`), etc. Cool, that makes sense and I can defer that for now!
	- This sort of works:
	-
	  ``` js
	  		  function uppermostEdge(pos, node) {
	  		      let n = node
	  		      while (!isTop(n) && (pos === n.to && pos === node.to) ||
	  		                          (pos === n.from && pos === node.from)) {              
	  		          n = up(n)
	  		          break
	  		      }
	  		      if (!n) {
	  		          return node
	  		      }
	  		      return n
	  		  }
	  ```
	- I believe now I need to implement `balanced-range`:
	-
	  ``` clojure
	  		  (j/defn balanced-range
	  		    ([state ^js node] (balanced-range state (start node) (end node)))
	  		    ([state from to]
	  		     (let [[from to] (sort [from to])
	  		           from-node (tree state from 1)
	  		           to-node (tree state to -1)
	  		           from (if (require-balance? from-node)
	  		                  (start from-node)
	  		                  from)
	  		           to (if (require-balance? to-node)
	  		                (end to-node)
	  		                to)
	  		           [left right] (->> (nodes-between from-node to-node)
	  		                             (map #(cond-> % (edge? %) up))
	  		                             (reduce (fn [[left right] ^js node-between]
	  		                                       [(if (ancestor? node-between from-node) (start node-between) left)
	  		                                        (if (ancestor? node-between to-node) (end node-between) right)])
	  		                                     [from to]))]
	  		       (sel/range left right))))
	  ```
	- An example that currently fails is if the cursor is on the number.
	- uppermost-edge obviously returns the entire enclosing form. But `nodeAtCursor` needs to take that result along with the state. This invokes the 2-arity, which calls it on the 3-arity, with the `.from` and `.to` of the node.
- # Will it build?
	- The Vite build preview works now, but I still can't get it launched to github.
	- I figured it out! I just needed to add the `vite.config.js` file providing the base path!
	-
	  ``` js
	  		  import { defineConfig } from "vite";
	  		  
	  		  export default defineConfig({
	  		      base: '/lang-clojure-eval/'
	  		  })
	  ```
	- I'm going to hold off on announcing it until it actually works, but this is great!
- # Compare behavior to clojure-mode
	- This is cool... I'm hacking clojure-mode to have it output debug info.
	- uppermost-edge is just as I thought, it's the node at the cursor, but I don't understand what the balanced-range thing is for. I guess not all nodes are a balanced range, I'll find out eventually. But I'm having trouble with the upper edge thing even though I know exactly what I want to do...
	- I'm too eepy to figure it out today. I'll have to pick this up again soon.
- # 6-24
	- I need to finish implementing `highestParent`:
	-
	  ``` clojure
	  		  (defn highest-parent [pos node]
	  		    (->> (iterate n/up node)
	  		         (take-while (every-pred (complement n/top?)
	  		                                 #(or (= pos (n/end %) (n/end node))
	  		                                      (= pos (n/start %) (n/start node)))))
	  		         (last)))
	  ```
	- If the cursor is here (where the pipe is), `(map inc (range 5)|)` it should return the node starting at 9, `(range 5)`.
	- The `parents` function gets all the parents until we hit the top level:
	-
	  ``` js
	  		  function parents(node, p) {
	  		      if (isTop(node)) return p;
	  		      return parents(up(node), p.concat(node));
	  		  }
	  ```
	- I still don't quite understand this predicate:
	-
	  ``` clojure
	  		  (or (= pos (n/end %) (n/end node))
	  		      (= pos (n/start %) (n/start node)))
	  ```
	- The node passed in is right before the cursor position, that's what `-1` means for the `dir` parameter (called `side` 'by codemirror). The arg (`%``) passed in is the node currently being checked.
	- This is the problem... this is wrong
	-
	  ``` js
	  		  const array = [1, 2, 3];
	  		  let t = [];
	  		  for (let i = 0; i < array.length; i++) {
	  		      t.concat(array[i]);
	  		  }
	  		  console.log(t);
	  ```
	- I think it should output `[1, 2, 3]` but it outputs `[]`. Why?
	- Answer: `concat` doesn't change the array! You need to reassign it:
	-
	  ``` js
	  		  const array = [1, 2, 3];
	  		  let t = [];
	  		  for (let i = 0; i < array.length; i++) {
	  		      t = t.concat(array[i]);
	  		  }
	  ```
	- Meanwhile, I found a better solution using `filter`:
	-
	  ``` js
	  		  function filterParents(pos, node, p) {
	  		      const result = p.filter(n => pos == n.to && pos == node.to);
	  		      return result
	  		  }
	  ```
	- Which is obviously what I should have done in the first place. Great! Now I know that.
- Implemented `evalTopLevel`. Now it's just finishing the `nodeACursor` function before implementing the UI.
- Made keybindings cross platform, with Ctrl mapped to Cmd on Mac because afaik, Alt is Option so will work on both, but the Ctrl key on mac keyboards is only on the left side which is inconvenient.
- I think I need to fix the `children` function, which gets called if... well this is where it currently fails:
-
  ``` clojure
	  (map inc (|range 5))
  ```
- In clojure-mode, it evaluates `range`, which I think is because its `nearest-touching` function will sometimes use the node on the right side (or mid, whatever the fuck that means).
- But I'm not sure if I even want it like that... how does Calva do it?
- The same, but I still think I don't care, at least, not yet.
- # Eval issue
	- Wait... it's not keeping the same eval context... because it's just using loadString and we need to do the thing where you init a sci context. See https://github.com/babashka/sci#state
	- YES! It actually works! I was... not expecting that tbh
- # UI
	- Okay, I guess now it's good enough for me! Let's start displaying it inline! I'll make some more coffee and kratom, yo
	- We'll start with evalAtCursor because it's the most involved (and also the most useful)
	- It works! I've got `evalAtCursor` done:
	- ![eval2.gif](../assets/eval2_1687679570726_0.gif)
	- Codemirror 6 plugin based on nextjournal/lang-clojure and nextjournal/clojure-mode, usings SCI for inline evaluation.
	- I had to translate parts of clojure-mode into JavaScript and sort of cut a few corners but it basically works. Bug reports welcome. https://www.npmjs.com/package/lang-clojure-eval
	- Thanks to Clojurists Together for sponsoring this work!
- # Included evalExtension in LanguageSupport
	- This is the piece I was missing so that the eval stuff works without having to add it as a separate extension when the view is instantiated! Needed to read about that [here](https://codemirror.net/examples/lang-package/):
	-
	  > Finally, it is convention for language packages to export a main function (named after the language, so it's called css in @codemirror/lang-css for example) that takes a configuration object (if the language has anything to configure) and returns a LanguageSupport object, which bundles a Language instance with any additional supporting extensions that one might want to enable for the language.

	-
	  ``` js
	  		  import {LanguageSupport} from "@codemirror/language"
	  		  
	  		  export function example() {
	  		    return new LanguageSupport(exampleLanguage, [exampleCompletion])
	  		  }
	  ```
      