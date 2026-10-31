"use client";

import { useEffect, useState } from "react";

// Timecode que corre a 24 fps, como el monitor de cámara.
export function Timecode({ className }: { className?: string }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const ini = performance.now();
    let raf = 0;
    const tick = () => {
      setT((performance.now() - ini) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const dos = (n: number) => String(Math.floor(n)).padStart(2, "0");
  return <span className={className}>{`${dos(t / 3600)}:${dos((t / 60) % 60)}:${dos(t % 60)}:${dos((t % 1) * 24)}`}</span>;
}
