import {describe, expect, test, it} from 'vitest'
import {EditorState} from "@codemirror/state"
import {sciInit} from "../src/sci"
import {tryEval} from "../src/eval-region"
import {clojure} from "../src/clojure"
 
describe('Editor state', () => {
    let state = EditorState.create({
        doc: `(map inc (range 5))`,
        extensions: [clojure()]
    })
    it('Creates EditorState', () => {
        expect(state.doc.text[0]).eq("(map inc (range 5))")
    })

    it('Evaluates Clojure code', () => {
        let ctx = sciInit()
        expect(tryEval(ctx, state.doc.text[0])).eq("(1 2 3 4 5)")
    })
})