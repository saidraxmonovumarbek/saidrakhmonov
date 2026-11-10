"use client";

import { Quote as QuoteIcon } from "lucide-react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {children}
    </motion.span>
  );
}

/** The words light up one by one as you scroll past. */
export function Quote({ text, author }: { text: string; author: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.92", "end 0.72"] });
  const words = `“${text}”`.split(" ");
  const authorOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  return (
    <section>
      <div className="band" aria-hidden />
      <figure ref={ref} className="px-6 py-16 text-center sm:px-14 sm:py-20">
        <QuoteIcon className="mx-auto size-8 fill-current text-muted" aria-hidden />
        <blockquote
          aria-label={text}
          className="mt-7 flex flex-wrap justify-center gap-x-[0.3em] text-[1.75rem] leading-[1.35] font-light tracking-wide italic sm:text-[2.1rem]"
        >
          {words.map((word, i) => (
            <Word
              key={i}
              progress={scrollYProgress}
              range={[(i / words.length) * 0.85, ((i + 1) / words.length) * 0.85]}
            >
              {word}
            </Word>
          ))}
        </blockquote>
        <motion.figcaption style={{ opacity: authorOpacity }} className="mt-6 font-mono text-sm text-muted">
          — {author}
        </motion.figcaption>
      </figure>
    </section>
  );
}
