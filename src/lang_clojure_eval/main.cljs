(ns lang-clojure-eval.main
  (:require 
   [lang-clojure-eval.eval-region]
   [lang-clojure-eval.node]))

(defn hello []
  (js/console.log "hello world"))