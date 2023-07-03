(ns lang-clojure-eval.character
  (:require [clojure.string :as str]
            [clojure.edn :as edn]))

(defn digit [c r]
  (edn/read-string (str r "r" c)))

(defn isLetter [char]
  (and (= 1 (count (str char)))
       (not= (str/upper-case char) 
             (str/lower-case char))))

(defn isISOControl [char]
  (boolean (re-seq #"[\u0000-\u001F\u007F-\u009F]" char)))
