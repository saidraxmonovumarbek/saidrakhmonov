/**
 * Kind words from other people (tweets, messages, reviews).
 * These are PLACEHOLDERS: replace them with real quotes, or set the
 * array to [] to hide the Highlights section entirely.
 */

export interface Highlight {
  name: string;
  handle: string;
  quote: string;
  /** Optional link to the original post. */
  href?: string;
  /** Optional avatar image in /public. Initials are shown if empty. */
  avatar?: string;
  verified?: boolean;
}

export const highlights: Highlight[] = [
  {
    name: "A mentor",
    handle: "@replace_me",
    quote: "Placeholder: paste something nice a mentor said about your work.",
    verified: true,
  },
  {
    name: "A teammate",
    handle: "@replace_me",
    quote: "Placeholder: a short line from someone you built a project with.",
  },
  {
    name: "A client",
    handle: "@replace_me",
    quote: "Placeholder: feedback from a client or a user of your app.",
    verified: true,
  },
  {
    name: "A friend",
    handle: "@replace_me",
    quote: "Placeholder: even a two-word reply like “Looks great” works here.",
  },
];
