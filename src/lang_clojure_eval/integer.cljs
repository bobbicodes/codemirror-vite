(ns lang-clojure-eval.integer
  (:require [clojure.edn :as edn]))

(defn parse-int [s]
  (edn/read-string s))