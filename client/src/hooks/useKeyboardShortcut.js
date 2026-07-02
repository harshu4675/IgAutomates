import { useEffect } from "react";

export function useKeyboardShortcut(keys, callback, deps = []) {
  useEffect(() => {
    const handler = (e) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      const isMatch = keyArray.every((key) => {
        if (key === "cmd" || key === "meta") return e.metaKey || e.ctrlKey;
        if (key === "shift") return e.shiftKey;
        if (key === "alt") return e.altKey;
        if (key === "ctrl") return e.ctrlKey;
        return e.key.toLowerCase() === key.toLowerCase();
      });

      if (isMatch) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, deps);
}
