"use client";

import { useEffect, useState } from "react";

export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    setDark(html.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
