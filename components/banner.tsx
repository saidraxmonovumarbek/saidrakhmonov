"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createCurrents, type Currents } from "@/lib/currents/engine";

type Status = "loading" | "ready" | "fallback";

/**
 * The hero: a chrome ball riding a current of violet ridges and lava,
 * rendered live in WebGL (lib/currents). Hold to accelerate, tap to make the
 * ball jump. Pauses off screen and shows a single frame for reduced motion.
 */
export function Banner() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Currents | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [touched, setTouched] = useState(false);

  // gentle parallax while the banner scrolls away
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = createCurrents(canvas, {
      still,
      onReady: () => setStatus("ready"),
      onError: () => setStatus("fallback"),
    });
    if (!engine) {
      setStatus("fallback");
      return;
    }
    engineRef.current = engine;

    const resizeWatcher = new ResizeObserver(() => engine.resize());
    resizeWatcher.observe(canvas);
    const viewWatcher = new IntersectionObserver(([entry]) => engine.setVisible(entry.isIntersecting));
    viewWatcher.observe(wrap);
    const onPageVisibility = () => engine.setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onPageVisibility);

    return () => {
      resizeWatcher.disconnect();
      viewWatcher.disconnect();
      document.removeEventListener("visibilitychange", onPageVisibility);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // pointer: move to steer the camera, hold to accelerate, tap to jump
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let downAt = 0;
    let holdTimer = 0;
    let holding = false;

    const onMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      engineRef.current?.setPointer(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
      );
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      downAt = performance.now();
      holding = true;
      setTouched(true);
      holdTimer = window.setTimeout(() => {
        if (holding) engineRef.current?.setBoost(true);
      }, 180);
    };
    const onUp = () => {
      if (!holding) return;
      holding = false;
      clearTimeout(holdTimer);
      engineRef.current?.setBoost(false);
      if (performance.now() - downAt < 180) engineRef.current?.jump();
    };
    const onLeave = () => engineRef.current?.releasePointer();
    const onMenu = (event: Event) => event.preventDefault();

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("contextmenu", onMenu);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);
    return () => {
      clearTimeout(holdTimer);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("contextmenu", onMenu);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, []);

  return (
    <div className="rule-b p-2">
      <div
        ref={wrapRef}
        className="currents relative aspect-[4/5] cursor-grab touch-pan-y overflow-hidden rounded-md bg-[#07040d] select-none active:cursor-grabbing min-[480px]:aspect-[4/3] sm:aspect-[16/9]"
      >
        <motion.canvas
          ref={canvasRef}
          style={{ y, scale }}
          role="img"
          aria-label="Animated scene: a chrome ball rolls through a flowing field of violet ridges, parting a ribbon of glowing lava"
          data-ready={status === "ready"}
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
        />
        {status === "fallback" && <div aria-hidden className="currents-fallback absolute inset-0" />}
        <p
          aria-hidden
          data-hidden={touched || status !== "ready"}
          className="pointer-events-none absolute bottom-3 left-3.5 font-mono text-[10.5px] tracking-[0.18em] text-white/60 uppercase [text-shadow:0_1px_8px_rgb(0_0_0/0.6)] transition-opacity duration-700 data-[hidden=true]:opacity-0 sm:bottom-4 sm:left-5 sm:text-[11px]"
        >
          Hold to accelerate · Tap to jump
        </p>
      </div>
    </div>
  );
}
