"use client";

import { useEffect, useState } from "react";
import {
  onSoundState,
  prepareSound,
  soundState,
  SOUNDTRACK,
  startSound,
  stopSound,
  type SoundState,
} from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * Plays the soundtrack on a loop for every visitor and lets them turn it off.
 * It is on by default on every visit: turning it off is not remembered, so a
 * refresh starts the music again. Browsers hold sound back until the first
 * interaction, so the music starts on the first click, tap or key press
 * anywhere on the page.
 */
export function SoundToggle() {
  const [state, setState] = useState<SoundState>(soundState);

  useEffect(() => onSoundState(setState), []);

  useEffect(() => {
    let armed = false;
    const onGesture = (event: Event) => {
      // the toggle button handles its own clicks
      if ((event.target as Element | null)?.closest("[data-sound-toggle]")) return;
      if (soundState() === "playing" || soundState() === "paused") return disarm();
      void startSound(true).then((ok) => ok && disarm());
    };
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const arm = () => {
      if (armed) return;
      armed = true;
      events.forEach((e) => window.addEventListener(e, onGesture, { capture: true }));
    };
    const disarm = () => {
      if (!armed) return;
      armed = false;
      events.forEach((e) => window.removeEventListener(e, onGesture, { capture: true }));
    };

    void prepareSound().then(() => {
      if (soundState() === "paused") return;
      void startSound(false).then((ok) => !ok && arm());
    });
    return disarm;
  }, []);

  const playing = state === "playing";
  const waiting = state === "waiting" || state === "idle";

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={() => (playing ? stopSound() : void startSound(true))}
      aria-pressed={playing}
      aria-label={playing ? "Turn the music off" : "Turn the music on"}
      title={`${SOUNDTRACK.title} · ${SOUNDTRACK.artist}`}
      className={cn(
        "group relative flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
        playing
          ? "border-white/15 bg-white/[0.08] text-fg hover:bg-white/[0.12]"
          : "border-white/10 text-muted hover:border-white/20 hover:text-fg",
      )}
    >
      <span aria-hidden className="flex h-3.5 items-end gap-[2.5px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("eq-bar w-[2.5px] rounded-full bg-current", playing && "eq-on")}
            style={{ animationDelay: `${i * -0.23}s`, height: playing ? undefined : `${[5, 9, 6, 11][i]}px` }}
          />
        ))}
      </span>
      <span className="hidden sm:inline">{playing ? "Sound on" : waiting ? "Tap for sound" : "Sound off"}</span>
      {waiting && (
        <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 animate-pulse-dot rounded-full bg-[#ff7a1a] text-[#ff7a1a]" />
      )}
    </button>
  );
}
