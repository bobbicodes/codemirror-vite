(ns lang-clojure-eval.main
  (:require [sci.core :as sci]
            [lang-clojure-eval.error :refer [error-handler]]
            [lang-clojure-eval.character :as char]
            [lang-clojure-eval.integer :as int]
            [goog.string]
            [goog.string.format]
            [clojure.pprint :as pprint]
            [sci.impl.evaluator]))

(defonce context
  (sci/init {:classes {'js goog/global
                       :allow :all}
             :namespaces {'clojure.core {'format goog.string/format}
                          'lang-clojure-eval.character
                          {'digit char/digit
                           'isISOControl char/isISOControl
                           'isLetter char/isLetter
                           'isLowerCase char/isLowerCase
                           'isUpperCase char/isUpperCase}
                          'lang-clojure-eval.integer
                          {'parseInt int/parse-int}}}))

(defn eval-string [source]
  (let [reqs "(require '[lang-clojure-eval.character :as Character]
                       '[lang-clojure-eval.integer :as Integer])"]
    (try (binding [*print-length* 100]
           (with-out-str (pprint/pprint (sci/eval-string* context (str reqs source)))))
         (catch :default e
           (with-out-str (error-handler source e))))))
