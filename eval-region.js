import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { syntaxTree } from "@codemirror/language"
import { props } from "@nextjournal/lezer-clojure"
import { evalString } from "./sci"
import { NodeProp } from "@lezer/common"

// Node props are marked in the grammar and distinguish categories of nodes

// primitive collection
const collProp = props.coll
// prefix collection - a prefix token that wraps the next element
const prefixCollProp = props.prefixColl
// the prefix edge itself
const prefixEdgeProp = props.prefixEdge
// prefix form - pair of [metadata, target]
const prefixContainerProp = props.prefixContainer
// edges at the beginning/end of collections, + "same" edges (string quotes)
const startEdgeProp = NodeProp.closedBy
const endEdgeProp = NodeProp.openedBy
const sameEdgeProp = props.sameEdge

function up(node) {
    return node.parent;
}

function isTopType(nodeType) {
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

function isTerminalType(nodeType) {
    if (isTopType(nodeType || nodeType.prefixCollProp.prop() ||
    nodeType.collProp.prop() || nodeType.name == "Meta" ||
    nodeType.name == "TaggedLiteral" || nodeType.name == "ConstructorCall")) {
        return false
    } else {
        return true
    }
}

function nodeAtCursor(state, from) {
    return nearestTouching(state, from, -1)
}

function rangeStr(state, selection) {
    return state.doc.slice(selection.from, selection.to).toString()
}

function cursorNodeString(state) {
    return rangeStr(state, nodeAtCursor(state))
}

function evalAtCursor(view) {
    console.log(cursorNodeString(view.state))
    return true
}

export function evalExtension() {
    return Prec.highest(keymap.of(
        [{
            key: "Shift-Enter",
            run: evalCell
        },
        {
            key: "Ctrl-Enter",
            run: evalAtCursor
        }]))
}