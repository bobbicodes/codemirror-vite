(ns lang-clojure-eval.main
  (:require [sci.core :as sci]
            [lang-clojure-eval.error :refer [error-handler]]
            [goog.string]
            [goog.string.format]
            [clojure.pprint :as pprint]
            [sci.impl.evaluator]))

(defonce context
  (sci/init {:classes {'js goog/global
                       :allow :all}
             :namespaces {'clojure.core {'format goog.string/format}}}))

(defn eval-string [source]
  (try (binding [*print-length* 100]
         (with-out-str (pprint/pprint (sci/eval-string* context source))))
       (catch :default e
         (with-out-str (error-handler source e)))))
