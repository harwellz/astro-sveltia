---
id: ref-home-hero                 # kebab-case, unique
kind: reference                   # reference | asset | brand
skill: imagegen-frontend-web
status: pending                   # pending → rendered → integrated  (or rejected)
aspect_ratio: "16:9"
size: 1920x1080
format: png                       # reference: png · asset: webp/avif · logo: svg
target: design/references/01-home-hero.png
used_by:
  - src/pages/[...lang]/index.astro
locales: all                      # all | [en, vi] — images containing text need one file per locale
text_in_image: none               # none | the exact text that must appear
created: 2026-09-27
---

## Prompt
<full prompt, one paragraph, in English, ready to paste into ChatGPT / Gemini / Midjourney…>

## Negative prompt
<what to avoid — take it from the anti-slop section of the skill>

## Palette & typography
<hex values and font names taken from DESIGN.md>

## Alt text
- en: …
- vi: …

## Integration notes
<placement, crop, responsive behaviour, loading hint (eager/lazy)>
