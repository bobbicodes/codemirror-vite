(ns lang-clojure-eval.character)

(defn isISOControl [char]
  (boolean (re-seq #"[\u0000-\u001F\u007F-\u009F]" char)))
