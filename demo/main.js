import './style.css'
import {EditorView, basicSetup} from 'codemirror'
import {EditorState} from '@codemirror/state'
import {clojure} from "../src/clojure"

let editorState = EditorState.create({
    doc: `(map inc (range 5))`,
    extensions: [basicSetup, clojure()]
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
                     topLevelText + ",Ctrl/Cmd+Enter = Eval at cursor, Esc/Arrows = Clear result";
  keyBindings = keyBindings.split(',');
  for ( let i = 0; i < keyBindings.length; i++ )
  keyBindings[i] = "" + keyBindings[i] + "<br>";
  keyBindings = keyBindings.join('');
  document.getElementById("keymap").innerHTML = keyBindings;
  