(ns lang-clojure-eval.main
  (:require [sci.core :as sci]
            [lang-clojure-eval.error :refer [error-handler]]
            [lang-clojure-eval.character :refer [isISOControl]]
            [goog.string]
            [goog.string.format]
            [clojure.pprint :as pprint]
            [sci.impl.evaluator]))

(defonce context
  (sci/init {:classes {'js goog/global
                       :allow :all}
             :namespaces {'clojure.core {'format goog.string/format}
                          'lang-clojure-eval.character {'isISOControl isISOControl}}}))

(defn eval-string [source]
  (let [reqs "(require '[lang-clojure-eval.character :as Character])"]
    (try (binding [*print-length* 100]
           (with-out-str (pprint/pprint (sci/eval-string* context (str reqs source)))))
         (catch :default e
           (with-out-str (error-handler source e))))))
