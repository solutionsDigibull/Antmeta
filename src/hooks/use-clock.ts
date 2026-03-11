"use client";

import { useState, useEffect } from "react";

export function useClock() {
  const [clock, setClock] = useState("--:--:-- IST");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + 5.5 * 3600000);
      const p = (n: number) => String(n).padStart(2, "0");
      setClock(`${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}:${p(ist.getUTCSeconds())} IST`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return clock;
}
