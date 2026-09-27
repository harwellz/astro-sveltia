# Image prompts

No image generation tool is available to the agents. Whenever a skill asks to "generate an image", the agent writes a **prompt file** here instead, keeps working with a placeholder, and the owner renders the image outside the repo.

## Layout

```
prompts/images/
├── README.md          # this file: workflow + index
├── _TEMPLATE.md       # copy this to start a new prompt
├── brand/             # logo, favicon, OG image          (skill: brandkit)
├── references/        # per-section mockups for reference (skill: imagegen-frontend-web / -mobile)
└── assets/            # real images shipped on the site  (skill: imagegen-frontend-web, styled per DESIGN.md)
```

Where rendered files go (`target` in the frontmatter):

| Kind | Target | Notes |
|---|---|---|
| `reference` | `design/references/` | Not shipped; agents read them to analyze the layout |
| `asset` | `src/assets/images/site/` | Optimized by `astro:assets` |
| placeholder | `src/assets/images/site/_placeholders/<id>.svg` | Same aspect ratio, token colors, avoids CLS |
| `brand` (favicon, OG) | `public/` | Only files that need a fixed URL |

File name: `<NN>-<page>-<section>.md`, e.g. `references/01-home-hero.md`, `assets/03-blog-default-cover.md`, `brand/01-logo.md`.

## Status lifecycle

`pending` → `rendered` (owner saved the file at `target`) → `integrated` (agent wired it in, task P5.6). Use `rejected` for prompts that are dropped.

## Rules for agents

1. A skill says "generate image" → write a prompt file from `_TEMPLATE.md`. Never call an image tool, never commit stock/picsum/hot-linked URLs.
2. One section = one prompt (the HARD OUTPUT RULE of `imagegen-frontend-web`). All prompts in a batch share the palette and typography from `DESIGN.md`.
3. Prefer images **without text** — let HTML render text so it can be translated, indexed and read by assistive tech. If text is unavoidable (logo), spell it out in `text_in_image`.
4. Never wait for an image: create `src/assets/images/site/_placeholders/<id>.svg` (flat token color, correct `aspect_ratio`) and import it; swap in the real image in P5.6.
5. When a reference image is rendered, read it (the Read tool shows images), write observations under *Integration notes*, then implement — the "analyze" step of `image-to-code`.

## Rendering (owner)

1. Open a prompt file, copy *Prompt* (and *Negative prompt*) into your image tool.
2. Export at the given `size` / `format`, save to `target`.
3. Set `status: rendered` and commit `feat(assets): add rendered <id>` (or ask an agent to).

## Index

| id | kind | status | target |
|---|---|---|---|
| _none yet_ | | | |
