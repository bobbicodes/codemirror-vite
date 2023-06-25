(ns lang-clojure-eval.main
  (:require [sci.core :as sci]))

(defn sci-init []
  (sci/init {}))

(defn eval-string [ctx s]
  (str (sci/eval-string* ctx s)))
