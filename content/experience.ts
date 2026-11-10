/** Work and education, newest first. These are placeholders: make them yours. */

export interface Job {
  role: string;
  company: string;
  href?: string;
  location: string;
  period: string;
  points: string[];
  tags: string[];
}

export const jobs: Job[] = [
  {
    role: "Full Stack Developer",
    company: "Freelance",
    location: "Remote",
    period: "2025 — Present",
    points: [
      "Design and build web apps for small businesses and startups, from first sketch to deployment.",
      "Own the whole stack: interface, API, database and hosting.",
      "Placeholder: replace these lines with what you actually shipped and the results it had.",
    ],
    tags: ["Next.js", "TypeScript", "PostgreSQL"],
  },
  {
    role: "Frontend Developer Intern",
    company: "Company name",
    href: "https://example.com",
    location: "Tashkent, Uzbekistan",
    period: "2024 — 2025",
    points: [
      "Built reusable React components used across the product.",
      "Worked with designers to turn Figma files into responsive, accessible pages.",
    ],
    tags: ["React", "Tailwind CSS", "Figma"],
  },
];

export interface School {
  degree: string;
  school: string;
  period: string;
  note?: string;
}

export const education: School[] = [
  {
    degree: "B.Sc. in Computer Science",
    school: "University name",
    period: "2023 — 2027",
    note: "Placeholder: add your university, major, and anything you are proud of.",
  },
];
