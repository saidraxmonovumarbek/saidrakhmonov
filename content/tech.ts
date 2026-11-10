/**
 * Tech stack chips on the home page.
 * `icon` must be a key from components/tech-icon.tsx (add new ones there).
 */

export const techCategories = ["Frontend", "Backend", "Design", "Tools"] as const;
export type TechCategory = (typeof techCategories)[number];

export interface Tech {
  name: string;
  icon: string;
  category: TechCategory;
}

export const tech: Tech[] = [
  { name: "JavaScript", icon: "javascript", category: "Frontend" },
  { name: "TypeScript", icon: "typescript", category: "Frontend" },
  { name: "React", icon: "react", category: "Frontend" },
  { name: "Next.js", icon: "nextjs", category: "Frontend" },
  { name: "Tailwind CSS", icon: "tailwind", category: "Frontend" },
  { name: "Motion", icon: "framer", category: "Frontend" },
  { name: "Node.js", icon: "node", category: "Backend" },
  { name: "Express.js", icon: "express", category: "Backend" },
  { name: "Python", icon: "python", category: "Backend" },
  { name: "PostgreSQL", icon: "postgres", category: "Backend" },
  { name: "MongoDB", icon: "mongodb", category: "Backend" },
  { name: "Prisma", icon: "prisma", category: "Backend" },
  { name: "Figma", icon: "figma", category: "Design" },
  { name: "Git", icon: "git", category: "Tools" },
  { name: "GitHub", icon: "github", category: "Tools" },
  { name: "Vercel", icon: "vercel", category: "Tools" },
  { name: "Docker", icon: "docker", category: "Tools" },
  { name: "Postman", icon: "postman", category: "Tools" },
  { name: "Linux", icon: "linux", category: "Tools" },
];
