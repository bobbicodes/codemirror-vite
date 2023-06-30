import {describe, expect, test, it} from 'vitest'
import {EditorState} from "@codemirror/state"
import {EditorView} from "codemirror"
import {evalString} from "../src/sci"
import {evalCell, clearEval, evalTopLevel, evalAtCursor} from '../src/eval-region'
import {clojure} from "../src/clojure"
 
describe('Editor state', () => {
    let state = EditorState.create({
        doc: `(map inc (range 5))`,
        extensions: [clojure()]
    })
    let view = new EditorView({
        state: state,
        parent: document.querySelector('#app')
    })
    it('Creates EditorState', () => {
        expect(state.doc.text[0]).eq("(map inc (range 5))")
    })

    it('Evaluates Clojure code', () => {
        expect(evalString(state.doc.text[0])).eq("(1 2 3 4 5)\n")
    })

    it('Evaluates Cell', () => {
        evalCell(view)
        expect(view.state.doc.text.join(" ")).eq("(map inc (range 5))  => (1 2 3 4 5)")
    })
    it('Clears evaluation result', () => {
        clearEval(view)
        expect(view.state.doc.text.join(" ")).eq("(map inc (range 5))")
    })
    it('Evaluates top-level form', () => {
        evalTopLevel(view)
        console.log(view.state.doc.toString())
        expect(view.state.doc.toString()).eq("(map inc (range 5)) => (1 2 3 4 5) ")
    })
    it('Evaluates at cursor', () => {
        clearEval(view)
        view.dispatch({selection: {anchor: 18, head: 18}})
        evalAtCursor(view)
        expect(view.state.doc.toString()).eq("(map inc (range 5) => (0 1 2 3 4) )")
    })
})