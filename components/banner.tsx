"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { createScene, SCENE_H, SCENE_W, type SceneTheme } from "@/lib/pixel-scene";

const FPS = 12;

/**
 * The animated pixel-art landscape. It is drawn by code (lib/pixel-scene.ts),
 * follows the site theme (day / night) and pauses when it is off screen.
 */
export function Banner() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // gentle parallax while the banner scrolls away
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const image = ctx.createImageData(SCENE_W, SCENE_H);
    const pixels = new Uint32Array(image.data.buffer);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    const themeNow = (): SceneTheme =>
      document.documentElement.getAttribute("data-theme") === "dark" ? "night" : "day";

    let theme = themeNow();
    let scene = createScene(theme);
    let tick = 40;
    let visible = true;
    let raf = 0;
    let last = 0;

    const paint = () => {
      scene.render(tick, pixels);
      ctx.putImageData(image, 0, 0);
      canvas.dataset.ready = "true";
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || reduced.matches) return;
      if (now - last < 1000 / FPS) return;
      last = now;
      tick++;
      paint();
    };

    const themeWatcher = new MutationObserver(() => {
      const next = themeNow();
      if (next === theme) return;
      theme = next;
      scene = createScene(theme);
      paint();
    });
    themeWatcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const viewWatcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    viewWatcher.observe(canvas);

    paint();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      themeWatcher.disconnect();
      viewWatcher.disconnect();
    };
  }, []);

  return (
    <div className="rule-b p-2">
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-md bg-[#b1d6e0] dark:bg-[#17264d]"
        style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
      >
        <motion.canvas
          ref={canvasRef}
          width={SCENE_W}
          height={SCENE_H}
          style={{ y, scale }}
          role="img"
          aria-label="Animated pixel-art landscape: waterfalls pouring from forested cliffs into a lake"
          className="pixelated absolute inset-0 size-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100"
        />
      </div>
    </div>
  );
}
