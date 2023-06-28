(ns lang-clojure-eval.main
  (:require [sci.core :as sci]
            [clojure.pprint :as pprint]))

(defn sci-init []
  (sci/init {}))

(defn eval-string [ctx s]
  (with-out-str (pprint/pprint (sci/eval-string* ctx s))))


