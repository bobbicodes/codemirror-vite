(ns lang-clojure-eval.main
  (:require [sci.core :as sci]
            [lang-clojure-eval.error :refer [error-handler]]
            [lang-clojure-eval.character :as char]
            [lang-clojure-eval.integer :as int]
            [goog.string]
            [goog.string.format]
            [clojure.pprint :as pprint]
            [rewrite-clj.zip :as z]
            [sci.impl.evaluator]))

(defonce context
  (sci/init {:classes {'js goog/global
                       :allow :all}
             :namespaces {'clojure.core {'format goog.string/format}
                          'lang-clojure-eval.character
                          {'digit char/digit
                           'isISOControl char/isISOControl
                           'isLetter char/isLetter
                           'isAlphabetic char/isAlphabetic
                           'isLowerCase char/isLowerCase
                           'toUpperCase char/toUpperCase
                           'toLowerCase char/toLowerCase
                           'isSpace char/isSpace
                           'isUpperCase char/isUpperCase}
                          'lang-clojure-eval.integer
                          {'parseInt int/parse-int}}}))

(defn current-ns [source]
  (z/sexpr (z/next (z/find-next-value (z/of-string source) z/next 'ns))))

(defn eval-string [source]
  (let [reqs (str "(ns " (or (current-ns source) "lang-clojure-eval")
                  "(:require [lang-clojure-eval.character :as Character]
                       [lang-clojure-eval.integer :as Integer]))
              (defn int [x]
                (if (.isInteger js/Number (js/parseInt x))
                    (js/parseInt x)
                    (.charCodeAt x 0)))")]
    (try (binding [*print-length* 100]
           (with-out-str (pprint/pprint (sci/eval-string* context (str reqs source)))))
         (catch :default e
           (with-out-str (error-handler source e))))))

