# saidrakhmonov

Personal website: home, projects, articles, milestones and experience.
Built with Next.js, Tailwind CSS and Motion.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Set up the admin side (once)

The site has an editor that only you can use. Visitors never sign in.

1. **Database.** In Vercel open the project → **Storage** → **Create Database** →
   **Neon** (free plan) and connect it to this project. It adds `DATABASE_URL`
   for you. The tables are created on first use.
2. **Password.** In Vercel → **Settings** → **Environment Variables**, add
   `ADMIN_PASSWORD` with a long password only you know.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so both take effect.

Then go to **`/admin`** on your site and log in. You stay logged in for 30 days
on that browser. Changing `ADMIN_PASSWORD` logs out every browser.

To try it locally, create `.env.local` with `ADMIN_PASSWORD=something` and run
`npm run dev`. Without `DATABASE_URL`, edits and visits are saved to a
`.data/` folder on your computer instead.

## Edit your content

Once logged in, a small bar sits in the bottom-left corner of every page:

- **Edit**: every piece of text gets a faint outline. Click one to change it
  in a small editor right next to it (Enter saves, Esc cancels). For items in a
  list (a project, a milestone, a line of your bio) the editor also has buttons
  to see all fields, move, duplicate, add a new one after it, or delete it.
  Clicking a project's cover opens all of its fields (links, colours, image…).
- **New article** / **Edit this article** (on an article page): write in
  Markdown with a live preview, set the date, tags and address, keep it as a
  draft, or delete it.
- **Dashboard** (`/admin`): the visitor count, all articles (drafts too), and
  every section of the site as a form, including links and settings that
  don't show as text. Each section can be reset to the original.

Saved changes are live for everyone at once.

The files in `content/` are the starting text: what you save in the editor is
stored in the database and shown on top of them, so editing those files later
only changes sections you have not edited (or have reset).

| Starting text for                       | File                                   |
| --------------------------------------- | -------------------------------------- |
| Name, roles, bio, links, quote, nav     | `content/site.ts`                      |
| Section titles, page intros, buttons    | `content/copy.ts`                      |
| Projects                                | `content/projects.ts`                  |
| Tech stack chips                        | `content/tech.ts`                      |
| Milestones timeline                     | `content/milestones.ts`                |
| Work and education                      | `content/experience.ts`                |
| Highlights (kind words from others)     | `content/highlights.ts`                |
| Articles                                | `content/articles.ts`                  |

### Placeholders to replace first

The site ships with sample content. Before sharing the link, replace (all of
it can be done in the editor):

- [ ] Your **LinkedIn / Telegram / Mail links** (they point to example addresses), the "Let's Talk" email, and the site address (`url`, Dashboard → About you)
- [ ] `public/resume.pdf`: add your resume (the Resume tile links to it), or delete the Resume contact link
- [ ] Projects: your real projects and links
- [ ] Highlights: real quotes, or delete them all to hide the section
- [ ] Milestones, experience and articles: your own story

## Visitor count

The eye in the footer shows how many people have visited. Each browser
counts once (an anonymous random id, no personal data), bots and your own
visits as admin are not counted. The dashboard also shows total visits and
how many came in the last day and week.

## Music

The soundtrack is on by default for every visit and every refresh; the
toggle in the top bar turns it off until the next reload. Browsers do not let
any site play sound before the visitor has clicked, tapped or pressed a key,
so the music starts on that first interaction.

### Project screenshots

Each project card draws a gradient cover by default. To show a real
screenshot, put the image in `public/projects/` and set
`image: "/projects/my-app.png"` on that project.

## The live background

The whole site sits on a live WebGL2 scene rendered by `lib/currents/`
(no video or image files): a chrome ball drops into a flowing field of
violet ridges and rides a ribbon of lava while the camera moves through a
loop of shots. The content is laid on frosted glass over it; the home page
opens with a full-screen hero (`components/hero.tsx`) directly on the scene.
Press and hold on the scene to accelerate, tap it to make the ball jump (the
hint at the bottom of the first screen says so).

- `lib/currents/shaders.ts`: the look. Colours (`CREST`, `VALLEY`, the lava
  ramp), stripe density (`P`) and ridge height (`H`) are constants at the top.
- `lib/currents/engine.ts`: the motion. Camera shots (`SHOTS`), timings,
  speed and sparks.
- `components/scene-background.tsx`: mounts it once for every page, links it
  to scrolling and the pointer.
- `--panel` in `app/globals.css`: how see-through the glass is.

It caps how many pixels it shades, lowers its resolution further on slow
devices, halves its frame rate when the content covers it on phones, pauses
in background tabs, shows a single still frame for people who prefer reduced
motion, and falls back to a static CSS pattern without WebGL2.

The previous pixel-art landscape is still in `lib/pixel-scene.ts` if you
want it back.

## GitHub Activity

The contribution graph reads the public calendar of the username set in
`content/site.ts`. For the most reliable results, add a `GITHUB_TOKEN`
environment variable (a classic token with no scopes is enough) and the
official GitHub API is used instead.

## Colours and fonts

Theme colours are CSS variables at the top of `app/globals.css`.
Fonts are set in `app/layout.tsx`.

## Deploy

Push the repository to GitHub and import it at https://vercel.com/new.
No configuration is needed.
