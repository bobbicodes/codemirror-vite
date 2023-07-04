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

(defn reqs 
  "Takes a zipper at a node representing a `:require`
  form within the namespace declaration.
  Returns a sequence of the vectors containing the requires.
  "
  [req-form]
  (let [first-req (z/down req-form)]
    (loop [z first-req result []]
      (if-not (z/right z)
        result
        (recur (z/right z) 
               (conj result (z/sexpr (z/right z))))))))

(defn current-ns [source]
  (z/sexpr (z/next (z/find-next-value (z/of-string source) z/next 'ns))))

(def last-req (atom ""))

(defn eval-string 
  "Parses the code to be evaluated and finds the namespace declaration
  if there is one, extracts the requires and loads them in the env."
  [source]
  (let [ns-name (z/next (z/find-next-value (z/of-string source) z/next 'ns))
        req-form (z/right ns-name)
        reqs (str "(ns " (or (current-ns source) "lang-clojure-eval")
                  "\n  (:require [lang-clojure-eval.character :as Character]
        [lang-clojure-eval.integer :as Integer] "
               (apply str (interpose "\n" (reqs req-form))) "))
              (defn int [x]
                (if (.isInteger js/Number (js/parseInt x))
                    (js/parseInt x)
                    (.charCodeAt x 0)))")]
    (when (or req-form
              (and ns-name (nil? req-form))) (reset! last-req reqs))
    (try (binding [*print-length* 100]
           (with-out-str (pprint/pprint (sci/eval-string* context (str @last-req source)))))
         (catch :default e
           (with-out-str (error-handler source e))))))
