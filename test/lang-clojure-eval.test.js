import { assert, expect, test } from 'vitest'
import {EditorState} from "@codemirror/state"
import { evalString, sciInit } from "../src/sci"

test('evalString()', () => {
    let ctx = sciInit()
  expect(evalString(ctx, "(+ 1 2 3)")).toBe("6")
})
