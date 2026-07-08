"use client";

import { useLayoutEffect } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

export function useScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [active]);
}
