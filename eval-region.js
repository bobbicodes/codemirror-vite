import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { syntaxTree } from "@codemirror/language"
import { props } from "@nextjournal/lezer-clojure"
import { evalString, sciInit } from "./sci"
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
    return nodeType.isTop;
}

function isTop(node) {
    return isTopType(node.type);
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

function nearestTouching(state, pos) {
    const L = tree(state, pos, -1)
    const R = tree(state, pos, 1)
    const mid = tree(state, pos)
    return L
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

function children(parent, from, dir) {
    let child = parent.childBefore(from)
    return children(parent, child.from).unshift(child)
}

function parents(node, p) {
    if (isTop(node)) return p;
    return parents(up(node), p.concat(node));
}

function rangeStr(state, selection) {
    return state.doc.slice(selection.from, selection.to).toString()
}

// Return node or its highest parent that ends at the cursor position
 function uppermostEdge(pos, node) {
    const p = parents(node, []).filter(n => pos == n.to && pos == node.to);
    return p[p.length - 1] || node
}

function isTerminal(node, pos) {
    return isTerminalType(node.type) ||
           pos === node.from || pos === node.to
}

function nodeAtCursor(state) {
    const pos =  mainSelection(state).from
    const n = nearestTouching(state, pos)
    return uppermostEdge(pos, n)
}

let posAtFormEnd = 0

function topLevelNode(state) {
    const pos =  mainSelection(state).from
    const p = parents(nearestTouching(state, pos), [])
    if (p.length === 0) {
        return nodeAtCursor(state)
    } else {
        return p[p.length - 1]
    }
}

function cursorNodeString(state) {
    return rangeStr(state, nodeAtCursor(state))
}

function topLevelString(state) {
    return rangeStr(state, topLevelNode(state))
}

let ctx = sciInit()
let evalResult = ""
let codeTail = ""
let codeBeforeEval = ""
let posBeforeEval = 0

function updateEditor(view, text, pos) {
    const doc = view.state.doc.toString()
    codeBeforeEval = doc
    const end = doc.length
    view.dispatch({
        changes: {from: 0, to: end, insert: text},
        selection: {anchor: pos, head: pos}
    })
}

function evalAtCursor(view) {
    const doc = view.state.doc.toString()
    codeBeforeEval = doc
    posBeforeEval = view.state.selection.main.head
    const codeBeforeCursor = codeBeforeEval.slice(0, posBeforeEval)
    const codeAfterCursor = codeBeforeEval.slice(posBeforeEval, codeBeforeEval.length)
    evalResult = evalString(ctx, cursorNodeString(view.state))
    const codeWithResult = codeBeforeCursor + " => " + evalResult + " " + codeAfterCursor
    updateEditor(view, codeWithResult, posBeforeEval)
    view.dispatch({selection: {anchor: posBeforeEval, head: posBeforeEval}})
    return true
}

function clearEval(view) {
    if (evalResult.length != 0) {
        evalResult = ""
        updateEditor(view, codeBeforeEval, posBeforeEval)
    }
}

function evalTopLevel(view) {
    posAtFormEnd = topLevelNode(view.state).to
    const doc = view.state.doc.toString()
    posBeforeEval = view.state.selection.main.head
    codeBeforeEval = doc
    const codeBeforeFormEnd = codeBeforeEval.slice(0, posAtFormEnd)
    const codeAfterFormEnd = codeBeforeEval.slice(posAtFormEnd, codeBeforeEval.length)
    evalResult = evalString(ctx, topLevelString(view.state))
    const codeWithResult = codeBeforeFormEnd + " => " + evalResult + " " + codeAfterFormEnd
    console.log("codeWithResult:", codeWithResult)
    updateEditor(view, codeWithResult, posBeforeEval)
    //view.dispatch({selection: {anchor: posBeforeEval, head: posBeforeEval}})
    console.log("evalTopLevel>", evalString(ctx, topLevelString(view.state)))
    return true
}

function evalCell(view) {
    const doc = view.state.doc.toString()
    evalResult = evalString(ctx, view.state.doc.text.join(" "))
    const codeWithResult = doc + "\n" + " => " + evalResult
    updateEditor(view, codeWithResult, posBeforeEval)
    //console.log("evalCell>", evalString(ctx, view.state.doc.text.join(" ")))
    return true
}

export function evalExtension() {
    return Prec.highest(keymap.of(
        [{key: "Shift-Enter", run: evalCell},
         {key: "Ctrl-Enter", mac: "Cmd-Enter", run: evalAtCursor},
         {key: "Alt-Enter", run: evalTopLevel},
         {key: "Escape", run: clearEval},
         {key: "ArrowLeft", run: clearEval},
         {key: "ArrowRight", run: clearEval},
         {key: "ArrowUp", run: clearEval},
         {key: "ArrowDown", run: clearEval}]))
}
