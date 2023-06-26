import { describe, expect, test, it } from 'vitest'
import { EditorState } from "@codemirror/state"
import { evalString, sciInit } from "../src/sci"
import { clojure } from "../src/clojure"

test('evalString()', () => {
    let ctx = sciInit()
    expect(evalString(ctx, "(+ 1 2 3)")).toBe("6")
})

describe('Editor state', () => {
    let state = EditorState.create({
        doc: `(map inc (range 5))`,
        extensions: [clojure()]
    })
    it('Creates EditorState', () => {
        expect(state.doc.text[0]).eq("(map inc (range 5))")
    })

    it('bar', () => {
        expect(1 + 1).eq(2)
    })
})