/**
 * Your journey, newest first. Add anything that felt like a step forward:
 * first line of code, first client, a talk, a certificate, a launch.
 * These are placeholders: replace them with your own story.
 */

export interface Milestone {
  /** Shown next to the title, e.g. "Mar 2026". */
  date: string;
  year: number;
  title: string;
  text: string;
  /** Optional small label, e.g. "Launch", "Award", "Learning". */
  tag?: string;
  href?: string;
}

export const milestones: Milestone[] = [
  {
    date: "Nov 2026",
    year: 2026,
    title: "Launched this website",
    text: "Finally gave my work a home: projects, articles and this timeline, all in one place.",
    tag: "Launch",
  },
  {
    date: "Jun 2026",
    year: 2026,
    title: "Shipped my first full-stack app",
    text: "Placeholder: auth, database, payments, deployment. The first project that real people used.",
    tag: "Launch",
  },
  {
    date: "Sep 2025",
    year: 2025,
    title: "First freelance client",
    text: "Placeholder: someone paid me to write code for the first time. Learned more about deadlines than about JavaScript.",
    tag: "Work",
  },
  {
    date: "Feb 2025",
    year: 2025,
    title: "100 days of code",
    text: "Placeholder: one hundred days in a row, with a small commit every single day.",
    tag: "Learning",
  },
  {
    date: "Oct 2024",
    year: 2024,
    title: "First open-source contribution",
    text: "Placeholder: a tiny documentation fix that got merged, and a big confidence boost.",
    tag: "Open source",
  },
  {
    date: "Mar 2024",
    year: 2024,
    title: "Fell in love with React",
    text: "Placeholder: components clicked, and building interfaces became the thing I wanted to do every day.",
    tag: "Learning",
  },
  {
    date: "Sep 2023",
    year: 2023,
    title: "Wrote my first line of code",
    text: "Placeholder: a `Hello, World!` that started everything.",
    tag: "Beginning",
  },
];
