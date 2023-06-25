(ns lang-clojure-eval.main
  (:require [sci.core :as sci]))

(defn sci-init [opts]
  (sci/init opts))

(defn eval-string [ctx s]
  (str (sci/eval-string* ctx s)))
