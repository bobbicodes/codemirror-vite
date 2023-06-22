(ns lang-clojure-eval.eval
  (:require [lang-clojure-eval.node :as n]))

(defn uppermost-edge-here
  "Returns node or its highest ancestor that starts or ends at the cursor position."
  [pos node]
  (or (->> (iterate n/up node)
           (take-while (every-pred (complement n/top?)
                                   #(or (= pos (n/end %) (n/end node))
                                        (= pos (n/start %) (n/start node)))))
           (last))
      node))