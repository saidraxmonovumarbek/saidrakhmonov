import {
  siCss,
  siDjango,
  siDocker,
  siExpress,
  siFastapi,
  siFigma,
  siFirebase,
  siFramer,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siLinux,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPostman,
  siPrisma,
  siPython,
  siReact,
  siRedis,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
  type SimpleIcon,
} from "simple-icons";

/**
 * Icons available to content/tech.ts. To add one, import it from
 * "simple-icons" (browse https://simpleicons.org) and add a key below.
 */
const ICONS: Record<string, SimpleIcon> = {
  javascript: siJavascript,
  typescript: siTypescript,
  react: siReact,
  nextjs: siNextdotjs,
  tailwind: siTailwindcss,
  framer: siFramer,
  html: siHtml5,
  css: siCss,
  node: siNodedotjs,
  express: siExpress,
  python: siPython,
  django: siDjango,
  fastapi: siFastapi,
  postgres: siPostgresql,
  mongodb: siMongodb,
  prisma: siPrisma,
  redis: siRedis,
  supabase: siSupabase,
  firebase: siFirebase,
  figma: siFigma,
  git: siGit,
  github: siGithub,
  vercel: siVercel,
  docker: siDocker,
  postman: siPostman,
  linux: siLinux,
};

/** Brand colours that are nearly black or white would vanish in one theme. */
function usable(hex: string): boolean {
  const n = parseInt(hex, 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.22 && lum < 0.9;
}

export function techIcon(key: string): { path: string; color: string } | null {
  const icon = ICONS[key];
  if (!icon) return null;
  return { path: icon.path, color: usable(icon.hex) ? `#${icon.hex}` : "var(--fg)" };
}
