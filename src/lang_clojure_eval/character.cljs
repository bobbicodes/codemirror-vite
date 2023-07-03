(ns lang-clojure-eval.character
  (:require [clojure.string :as str]
            [clojure.edn :as edn]))

(defn digit [c r]
  (edn/read-string (str r "r" c)))

(defn isLetter 
  "Takes either a char or a Unicode code point."
  [x]
  (if (int? x)
    (not= (str/upper-case (char x))
          (str/lower-case (char x)))
    (not= (str/upper-case x) 
          (str/lower-case x))))

(defn isAlphabetic 
  "Takes a Unicode code point."
  [int]
  (not= (str/upper-case (.fromCharCode js/String int))
        (str/lower-case (.fromCharCode js/String int))))

(defn isUpperCase 
  "Takes either a char or a Unicode code point."
  [x]
  (if (int? x)
    (and (isLetter (.fromCharCode js/String x))
         (= (.fromCharCode js/String x) 
            (str/upper-case (.fromCharCode js/String x))))
    (and (isLetter (.fromCharCode js/String x))
         (= x (str/upper-case x)))))

(defn isLowerCase 
  "Takes either a char or a Unicode code point."
  [x]
    (if (int? x)
      (and (isLetter (.fromCharCode js/String x))
           (= (.fromCharCode js/String x)
              (str/lower-case (.fromCharCode js/String x))))
      (and (isLetter x)
          (= x (str/lower-case x)))))

(defn isISOControl [char]
  (boolean (re-seq #"[\u0000-\u001F\u007F-\u009F]" char)))
