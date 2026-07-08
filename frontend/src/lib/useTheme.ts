import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [dark, setDarkState] = useState(() => {
    const stored = localStorage.getItem("mb_theme");
    return stored !== "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("mb_theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = useCallback(() => setDarkState((d) => !d), []);

  return { dark, toggle };
}
