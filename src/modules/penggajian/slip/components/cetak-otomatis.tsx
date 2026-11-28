"use client";

import { useEffect } from "react";

/** Opens the print dialog once, right after the print was recorded on the server. */
export function CetakOtomatis() {
  useEffect(() => {
    window.print();
  }, []);
  return null;
}
