# meganode

> scale your ideas

Personal site, portfolio and multilingual blog of a developer working across IT hardware and networking, digital marketing, data analytics and web3.

- GitHub: [harwellz](https://github.com/harwellz)
- X: [@harwellzz](https://x.com/harwellzz)
- Domain (not live yet): meganode.org

## Stack

- [Astro](https://astro.build) static site with Content Collections (`blog`, `tags`, `categories`, `authors`) in `src/data/`
- [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin`, committing content to GitHub
- Astro i18n routing — locales in `src/i18n/locales.ts`, UI strings in `src/i18n/translations/`
- Vanilla CSS (nesting + custom properties)
- pnpm, Node 24, TypeScript strict, Biome, Vitest
- Hosting: Cloudflare Workers static assets

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:4321
pnpm build               # astro check + astro build
pnpm test                # vitest run
pnpm biome ci .          # lint + format check (read-only)
pnpm biome check --write .   # auto-fix
pnpm preview             # serve dist/
```

## Project docs

- [`PLAN.md`](PLAN.md) — roadmap, current phase and task list
- [`CLAUDE.md`](CLAUDE.md) — conventions for contributors and agents
- [`Overview.md`](Overview.md) — background

## License

[MIT](LICENSE). Originally based on an open-source Astro i18n CMS starter; see `LICENSE` for the original copyright notice.
