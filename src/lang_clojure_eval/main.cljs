(ns lang-clojure-eval.main
  (:require [sci.core :as sci]))

(defn eval-string [s]
  (str (sci/eval-string s)))
