/**
 * Everything about YOU lives in this file.
 * Edit the text, save, and the site updates.
 *
 * Tip: wrap words in **double stars** to make them bold + underlined.
 */

export const site = {
  /** Full name, shown big on the home page. */
  name: "Umarbek Saidrakhmonov",
  /** Short name used as the logo in the top-left corner. */
  shortName: "Umarbek",
  /** Shown in the avatar tile until you add a photo. */
  initials: "US",
  /**
   * Your photo. Drop a square image into the /public folder
   * (for example public/avatar.jpg) and set this to "/avatar.jpg".
   * Leave empty to show your initials instead.
   */
  avatar: "",

  /** These rotate one after another under your name. */
  roles: ["Full Stack Developer.", "Design Engineer.", "Lifelong Learner."],

  location: "Tashkent, Uzbekistan",
  /** Used for the little live clock. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones */
  timeZone: "Asia/Tashkent",

  /** Small status pill above your name. Set `text` to "" to hide it. */
  status: { text: "Open to new projects", available: true },

  /** Used for link previews, search engines and the sitemap. */
  url: "https://saidrakhmonov.vercel.app",
  description:
    "Personal website of Umarbek Saidrakhmonov: projects, articles, milestones and experience.",

  /** Powers the GitHub Activity graph. */
  githubUsername: "saidraxmonovumarbek",

  about: [
    "I'm a **Full Stack Developer** who enjoys building digital products where thoughtful design meets clean, reliable code.",
    "I design and develop modern web apps with **React, Next.js, and TypeScript**, focusing on usability, performance, and small details that make interfaces feel alive.",
    "I like turning rough ideas into polished products, learning new technologies along the way, and writing down what I figure out.",
  ],

  /**
   * Contact tiles. `icon` is one of:
   * github | linkedin | telegram | x | instagram | mail | resume | link
   */
  contact: [
    { label: "GitHub", icon: "github", href: "https://github.com/saidraxmonovumarbek" },
    { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/your-username" },
    { label: "Telegram", icon: "telegram", href: "https://t.me/your_username" },
    { label: "Mail", icon: "mail", href: "mailto:you@example.com" },
    { label: "Resume", icon: "resume", href: "/resume.pdf" },
  ],

  /** The call-to-action near the bottom of the home page. */
  cta: {
    heading: "Scrolled Too Far",
    text: "If you've read this far, you might be interested in what I do.",
    button: "Let's Talk",
    href: "mailto:you@example.com",
  },

  quote: {
    text: "The best way to predict the future is to invent it.",
    author: "Alan Kay",
  },
} as const;

/** Top navigation. Items inside `more` appear under the "More" dropdown. */
export const nav = {
  main: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Articles", href: "/articles" },
  ],
  more: [
    { label: "Milestones", href: "/milestones", note: "The journey so far" },
    { label: "Experience", href: "/experience", note: "Work and education" },
  ],
} as const;
