# CLAUDE.md — shared rules for every agent working in this repo

Personal blog/site built from the open-source template `yacosta738/astro-cms`, being cleaned up, upgraded and redesigned.
**Read `PLAN.md` for the current phase and task list. Read `Overview.md` for background.** Tick tasks in `PLAN.md` as you finish them.

## Stack (current state — update this section when a phase changes it)

- **Astro 5** static site (SSG, no adapter) → output `dist/`. Target after Phase 3: Astro 7.
- **Content Collections** in `src/content.config.ts` (`blog`, `tags`, `categories`, `authors`), files in `src/data/<collection>/<lang>/...`. References use ids like `en/meganode`.
- **Sveltia CMS** at `/admin` (`src/pages/admin.astro`), config `public/admin/config.yml`. Commits content to GitHub through an OAuth Worker.
- **i18n**: Astro i18n routing. *Now*: every URL prefixed `/<lang>/`, default `en`. *Target after PLAN P2.5*: default `vi` served at `/` **without prefix**, other locales (`en es ja zh-cn ar`) prefixed; routes live in `src/pages/[...lang]/` with `lang: undefined` for `vi`. Locales in `src/i18n/locales.ts`; UI strings in `src/i18n/translations/*.ts`; helpers `useTranslations`, `getLocalePaths`, `localeParams` in `src/i18n/i18n.ts`, re-exported from `@/i18n`.
- **Styling**: vanilla CSS with nesting + custom properties in `src/styles/*.css` and component `<style>` blocks. No Tailwind unless `DESIGN.md` decides otherwise.
- **Tooling**: pnpm, Node 24 (`.node-version`), TypeScript strict, Biome (tabs, double quotes), Vitest.
- **Hosting target**: Cloudflare Workers static assets (`wrangler.jsonc`), Git branches `dev` → staging, `main` → production.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:4321
pnpm build               # astro check + astro build  (must pass before every commit)
pnpm test                # vitest run
pnpm biome ci .          # lint + format check, read-only (use this to verify)
pnpm biome check --write .   # auto-fix (note: `pnpm check` also writes files)
pnpm preview             # serve dist/
```

Shell is Windows (PowerShell / Git Bash). Do not use macOS-only flags such as `sed -i ''`.

## Code conventions

- Components: `PascalCase.astro` in `src/components/` (i18n UI in `src/components/i18n/`). Layouts in `src/layouts/`.
- Imports use aliases: `@/…` for `src/`, `@/i18n` for i18n helpers. Never deep-relative (`../../`).
- Pages under `src/pages/[lang]/` (after P2.5: `src/pages/[...lang]/`) must export `getStaticPaths` (use `localeParams` from `@/i18n`). Build every internal link with `getRelativeLocaleUrl(locale, path)` — never concatenate `/${locale}/` by hand (breaks the unprefixed default locale).
- Get the locale with `Astro.currentLocale as Lang`; translate with `const t = useTranslations(locale)`. No hard-coded user-facing text for only one language — add a key to `src/i18n/translations/*.ts` (all locales) or use a `Multilingual` object.
- Content queries: `getCollection("blog", ({ id, data }) => !data.draft && id.split("/")[0] === locale)`. **Always filter `draft`** in every listing, detail page and feed.
- Keep `src/content.config.ts` and `public/admin/config.yml` in sync: a field added/renamed in one must be changed in the other in the same commit.
- Images: import from `src/assets/**` and render with `<Image>`/`<Picture>` from `astro:assets`. `public/` only for files that need a fixed URL (favicon, OG image, `_headers`).
- Tests live in `**/__tests__/*.test.ts` (Vitest globals, see `src/i18n/__tests__/i18n.test.ts`). Pure logic in `src/i18n` or `src/lib` gets a test.
- No `console.log` left in committed code except the existing dev-only log in `src/i18n/ui.ts`.
- Accessibility: WCAG 2.2 AA; locale `ar` is RTL — use logical CSS properties (`margin-inline`, `padding-block`, `inset-inline-start`), never `left/right`.

## Dependency rules

- **TypeScript stays on 6.x** — `@astrojs/check` peer range is `^5 || ^6`. Do not install `typescript@latest` (7.x).
- Upgrade one major at a time (Astro 5 → 6 → 7), one commit per step, build green between steps.
- Do not add runtime dependencies without writing the reason in the commit body.

## Git conventions (mandatory)

**Branches**

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | production. Only receives merges from `dev` via PR. Never commit or push directly. | production URL |
| `dev` | integration / staging. Always buildable. | `dev` preview alias |
| `phase/<n>-<slug>` | one branch per PLAN phase, cut from `dev` (e.g. `phase/2-cleanup`) | branch preview URL |
| `track/<n>-<name>` | one parallel agent track inside phase `n`, cut from `phase/<n>-<slug>`, merged back `--no-ff` by the orchestrator (see `ORCHESTRATION.md`) | branch preview URL |
| `fix/<slug>`, `chore/<slug>` | small out-of-phase work, cut from `dev` | branch preview URL |

**Commits** — Conventional Commits, English, imperative, ≤ 72 chars subject:

```
<type>(<scope>): <subject>

<body: why, not what — optional>
Refs: PLAN.md <task id>
```

- `type`: `feat` `fix` `refactor` `style` `perf` `test` `docs` `build` `ci` `chore` `revert`
- `scope`: `blog` `content` `cms` `i18n` `layout` `ui` `styles` `seo` `assets` `deps` `ci` `deploy` `agents` `docs`
- Upgrades use `build(deps): upgrade astro 5 → 6`. Breaking behaviour gets `!` (`feat(i18n)!: drop zh-cn locale`).
- **One PLAN task = one commit** (or a few if genuinely separable). Never mix cleanup, upgrade and redesign in one commit.
- Before every commit: `pnpm build && pnpm test && pnpm biome ci .` must pass. Never use `--no-verify`.
- Stage explicit paths (`git add <files>`), not `git add -A`, so stray files (`.env`, screenshots) are not committed.

**Push / merge gates**

1. Agents commit on the phase branch and may push it (`git push -u origin phase/<n>-<slug>`) once the phase's validation passes.
2. Merge phase branch → `dev` with `git merge --no-ff` once CI is green and the phase's reviewer passed. Push `dev` (the owner checks staging at the release gate HG-3).
3. `dev` → `main` is a release PR (`gh pr create --base main --head dev --title "release: <phase>"`). **Only the human owner approves and merges it.** After merge, tag `vX.Y.Z` on `main`.
4. Never force-push `dev` or `main`. Never rewrite pushed history. Revert with `git revert`.

## Multi-agent rules

- Wave/track layout, agent chains and human gates: `ORCHESTRATION.md`.
- **Human gates (`HG-n`)**: some steps need the owner (accounts, dashboards, approvals, screenshots, real content). A subagent that reaches one must **stop and return `BLOCKED: HG-n — <what is needed>`**; it must never guess credentials, URLs or content. Only the main (orchestrator) session talks to the owner: it prints the gate block from `ORCHESTRATION.md`, asks, and waits for the reply `HG-n done`. Tracks that don't depend on the gate keep running.
- Research/review agents are read-only and may run in parallel.
- Agents that edit files get an explicit file scope (see PLAN.md Phase 5) and run in a separate worktree; they must not touch files outside their scope. Shared files (`src/styles/tokens.css`, `src/i18n/translations/*`) have a single owner per phase.
- Each agent finishes with `pnpm build` green and reports: files changed, commands run, anything left undone.

## Design & images

- Taste skills are installed in `.claude/skills/` (`redesign-existing-projects`, `design-taste-frontend`, `minimalist-ui`, `high-end-visual-design`, `industrial-brutalist-ui`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `image-to-code`, `brandkit`, `full-output-enforcement`).
- Design inputs from the owner: `design/BRIEF.md` (answers) and `design/inspiration/*` (screenshots they like, with notes in `design/inspiration/README.md`). Read them before any design decision; record your reading in `design/inspiration/ANALYSIS.md`.
- Product intent: home page = introduction + portfolio (`projects` collection) + featured articles hub, not a news feed. Blog articles are long-form SEO content — typography, reading comfort, TOC, structured data matter more than decoration.
- `DESIGN.md` (created in Phase 5) is the single source of truth for tokens, type, spacing and motion. Do not invent colors or fonts outside it.
- **No image generation tool is available.** When a skill says "generate an image", instead write a prompt file in `prompts/images/` following `prompts/images/README.md` and `_TEMPLATE.md`, then continue with a placeholder. Never block on a missing image. Never commit images produced by guessing or hot-linked stock URLs.
- Rendered images supplied by the owner land at the `target` path given in the prompt file; set that prompt's `status` to `integrated` when wired in.

## Don'ts

- Don't edit `pnpm-lock.yaml` by hand; don't commit `dist/`, `.astro/`, `node_modules/`, `.env*`.
- Don't reintroduce references to the template author (`yacosta738`, `astro-cms-dpv.pages.dev`).
- Don't modify `.agents/`, `skills-lock.json` or skill files unless the task says so.
- Don't deploy to production or merge to `main` on your own.
