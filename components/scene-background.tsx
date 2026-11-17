"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createCurrents, type Currents } from "@/lib/currents/engine";
import { soundLevel } from "@/lib/sound";

type Status = "loading" | "ready" | "fallback";

/** Elements that own their pointer events: the scene ignores presses on them. */
const INTERACTIVE = "header, a, button, input, textarea, select, label, summary, [role=menu], [contenteditable]";

/**
 * The whole-site backdrop: a chrome ball riding a current of violet ridges
 * and lava, rendered live in WebGL (lib/currents). It sits behind every page
 * and survives navigation. Press and hold on the scene (anywhere it shows,
 * outside the content) to accelerate; tap to make the ball jump.
 */
export function SceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Currents | null>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const pathname = usePathname();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = createCurrents(canvas, {
      still,
      onReady: () => setStatus("ready"),
      onError: () => setStatus("fallback"),
      getLevel: soundLevel,
    });
    if (!engine) {
      setStatus("fallback");
      return;
    }
    engineRef.current = engine;

    const resizeWatcher = new ResizeObserver(() => engine.resize());
    resizeWatcher.observe(canvas);
    const onPageVisibility = () => engine.setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onPageVisibility);

    return () => {
      resizeWatcher.disconnect();
      document.removeEventListener("visibilitychange", onPageVisibility);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // scroll: pull the camera back, dim the scene under the content, and drop to
  // half frame rate once the content covers nearly all of it (narrow screens)
  useEffect(() => {
    const update = () => {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const progress = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      engineRef.current?.setScroll(progress);
      engineRef.current?.setLowPower(window.innerWidth < 900 && heroBottom < 80);
      if (dimRef.current) dimRef.current.style.opacity = String(hero ? progress * 0.35 : 0.3);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // pointer: move to steer the camera, hold to accelerate, tap to jump
  useEffect(() => {
    let downAt = 0;
    let holdTimer = 0;
    let holding = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      engineRef.current?.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target || target.closest(INTERACTIVE)) return;
      // the content column is for reading; the hero is part of the scene
      if (target.closest("[data-panel]") && !target.closest("[data-hero]")) return;
      downAt = performance.now();
      holding = true;
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
    // a scroll gesture is not a hold
    const onScroll = () => {
      if (!holding) return;
      holding = false;
      clearTimeout(holdTimer);
      engineRef.current?.setBoost(false);
    };
    const onLeave = () => engineRef.current?.releasePointer();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      clearTimeout(holdTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="scene pointer-events-none fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        data-ready={status === "ready"}
        className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
      />
      {status === "fallback" && <div className="scene-fallback absolute inset-0" />}
      <div ref={dimRef} className="absolute inset-0 bg-[#05030a] opacity-0 transition-opacity duration-300" />
    </div>
  );
}
