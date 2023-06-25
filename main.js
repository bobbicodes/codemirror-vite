import './style.css'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { parser, props } from "@nextjournal/lezer-clojure"
import { styleTags, tags } from "@lezer/highlight"
import { indentNodeProp, foldNodeProp, foldInside, LRLanguage, LanguageSupport } from "@codemirror/language"
import { evalExtension } from "./eval-region"

const { coll } = props

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

export function clojure() {
  return new LanguageSupport(clojureLanguage)
}

let editorState = EditorState.create({
  doc: `(map inc (range 5))`,
  extensions: [basicSetup.slice(0, 15).concat(basicSetup.slice(16)), clojure(), evalExtension()]
})

function isLinux() {
  if (navigator.userAgent.match(/(Linux)|(X11)/g) === null) {
      return false
  }
  return true
}

function isMac() {
  if (!isLinux &&
      navigator.userAgent.match(/(Mac)|(iPhone)|(iPad)|(iPod)/g) != null) {
      return true
  }
  return false
}

function modifier() {
  if (isMac()) {
      return "Cmd"
  } else {
      return "Ctrl"
  }
}

new EditorView({
  state: editorState,
  parent: document.querySelector('#app')
}).focus()

let topLevelText = "Alt+Enter = Eval top-level form"
let keyBindings = "<strong>Key bindings:</strong>,Shift+Enter = Eval cell," + 
                   topLevelText + "," + modifier() + "+Enter = Eval at cursor";
keyBindings = keyBindings.split(',');
for ( let i = 0; i < keyBindings.length; i++ )
keyBindings[i] = "" + keyBindings[i] + "<br>";
keyBindings = keyBindings.join('');
document.getElementById("keymap").innerHTML = keyBindings;

//console.log(tree(editorState, 0))
//console.log(evalCell())
//console.log(editorState.doc.text.join(" "))
