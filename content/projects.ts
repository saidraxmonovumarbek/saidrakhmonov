/**
 * Your projects. The first four with `featured: true` show on the home page;
 * all of them show on /projects.
 *
 * Cover image: by default each card draws a gradient cover from `cover`.
 * To use a real screenshot, put it in /public (e.g. public/projects/app.png)
 * and set `image: "/projects/app.png"`.
 */

export type ProjectStatus = "Live" | "Building" | "Archived";

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  year: number;
  featured?: boolean;
  links: { live?: string; repo?: string };
  image?: string;
  cover: {
    /** Two colours for the gradient frame. */
    from: string;
    to: string;
    /** Text shown inside the little browser window. Use \n for a new line. */
    headline: string;
    /** Colour of the second headline line and the button. */
    accent: string;
    /** Optional ribbon across the corner, e.g. "800+ users". */
    ribbon?: string;
  };
}

export const projects: Project[] = [
  {
    slug: "fokus",
    title: "Fokus",
    tagline: "Study timer with streaks and stats.",
    description:
      "A calm productivity app for tracking focus sessions. Start a timer, tag what you worked on, and watch your streaks and weekly stats grow.",
    tags: ["Next.js", "TypeScript", "PostgreSQL"],
    status: "Live",
    year: 2026,
    featured: true,
    links: {
      live: "https://example.com",
      repo: "https://github.com/saidraxmonovumarbek",
    },
    cover: {
      from: "#d9f99d",
      to: "#65a30d",
      headline: "A workspace built for\nfocused work.",
      accent: "#4d7c0f",
      ribbon: "Placeholder project",
    },
  },
  {
    slug: "lugat",
    title: "Lug'at",
    tagline: "Uzbek-English dictionary with flashcards.",
    description:
      "A fast, offline-first dictionary with spaced-repetition flashcards. Search a word, save it, and review it right before you would forget it.",
    tags: ["React", "Tailwind CSS", "IndexedDB"],
    status: "Live",
    year: 2025,
    featured: true,
    links: {
      live: "https://example.com",
      repo: "https://github.com/saidraxmonovumarbek",
    },
    cover: {
      from: "#bfdbfe",
      to: "#2563eb",
      headline: "Every new word,\nremembered.",
      accent: "#1d4ed8",
    },
  },
  {
    slug: "siqish",
    title: "Siqish",
    tagline: "Private in-browser image compressor.",
    description:
      "Compress images right in the browser with zero uploads. Your files never leave your device, and the results are ready in a blink.",
    tags: ["Next.js", "WebAssembly", "Web Workers"],
    status: "Building",
    year: 2025,
    featured: true,
    links: { live: "https://example.com" },
    cover: {
      from: "#fed7aa",
      to: "#ea580c",
      headline: "Compress files.\nStore nothing.",
      accent: "#ea580c",
    },
  },
  {
    slug: "ui-kit",
    title: "UI Kit",
    tagline: "A small gallery of UI components.",
    description:
      "A collection of the components I keep rebuilding: buttons, menus, cards and little animations, all in one tidy, copy-paste friendly place.",
    tags: ["React", "Tailwind CSS", "Motion"],
    status: "Live",
    year: 2024,
    featured: true,
    links: {
      live: "https://example.com",
      repo: "https://github.com/saidraxmonovumarbek",
    },
    cover: {
      from: "#a5f3fc",
      to: "#0891b2",
      headline: "Components with\ncharacter.",
      accent: "#0e7490",
    },
  },
  {
    slug: "ob-havo",
    title: "Ob-havo",
    tagline: "Minimal weather app.",
    description:
      "A weather app that shows only what matters: now, next hours, next days. Built to learn data fetching, caching and skeleton states.",
    tags: ["React", "REST API"],
    status: "Archived",
    year: 2023,
    links: { repo: "https://github.com/saidraxmonovumarbek" },
    cover: {
      from: "#ddd6fe",
      to: "#7c3aed",
      headline: "Weather,\nwithout the noise.",
      accent: "#6d28d9",
    },
  },
  {
    slug: "portfolio",
    title: "This Website",
    tagline: "The site you are looking at.",
    description:
      "My corner of the internet: a Next.js site with a procedurally generated pixel-art banner, scroll animations and Markdown articles.",
    tags: ["Next.js", "Tailwind CSS", "Motion"],
    status: "Live",
    year: 2026,
    links: { repo: "https://github.com/saidraxmonovumarbek/saidrakhmonov" },
    cover: {
      from: "#e5e5e5",
      to: "#525252",
      headline: "Hello,\nI'm Umarbek.",
      accent: "#171717",
    },
  },
];
