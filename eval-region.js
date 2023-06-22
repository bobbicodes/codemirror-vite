import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { syntaxTree } from "@codemirror/language"

import { evalString } from "./sci"

function up(node) {
    return node.parent;
}

function topType(nodeType) {
    nodeType.isTop;
}

function evalCell(view) {
    console.log(evalString(view.state.doc.text.join(" ")))
    return true
  }
  
  function mainSelection(state) {
    return state.selection.asSingle().ranges[0]
  }
  
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

  function nearestTouching(state, pos, dir) {
    const L = tree(state, pos, -1)
    const R = tree(state, pos, 1)
    const mid = tree(state, pos)
  
    return mid
  }
  
  function nodeAtCursor(state, from) {
    return nearestTouching(state, from, -1)
  }
  
  function cursorNodeString(state) {
    return nodeAtCursor(state)
  }
  
  function evalAtCursor(view) {
    console.log(nearestTouching(view.state, ))
    return true
  }

export function evalExtension() {
    return Prec.highest(keymap.of(
      [{key: "Shift-Enter",
        run: evalCell},
        {key: "Ctrl-Enter",
        run: evalAtCursor}]))
  }