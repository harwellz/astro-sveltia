# Overview — astro-sveltia

> Tài liệu tham khảo được tạo ngày 2026-09-27 sau khi khảo sát toàn bộ repo (169 file được track, 1 commit `252a51d Initial commit`).
> Version "mới nhất" bên dưới được lấy trực tiếp từ npm registry vào ngày này.

---

## 1. Stack hiện tại

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Framework | **Astro 5.17** (SSG — static output, không có adapter) | Build ra HTML tĩnh trong `dist/` |
| Nội dung | **Astro Content Collections** (Content Layer API, `glob()` loader) | `src/content.config.ts`: `blog`, `tags`, `categories`, `authors` — dữ liệu ở `src/data/**` |
| Markdown | `@astrojs/mdx` | Blog post là `.mdx`, các trang docs `src/pages/<lang>/*.mdx` |
| CMS | **Sveltia CMS** (headless, Git-based, thay thế Decap/Netlify CMS) | Load từ CDN unpkg trong `src/pages/admin.astro`, config ở `public/admin/config.yml`, backend GitHub + OAuth qua 1 Cloudflare Worker |
| i18n | Astro i18n routing native + helper tự viết `src/i18n/*` | 5 ngôn ngữ: `en` (default), `es`, `ja`, `zh-cn`, `ar` (RTL). URL luôn có prefix `/en/...` |
| SEO | `@astrojs/sitemap` (có i18n), `@astrojs/rss` (RSS theo từng ngôn ngữ), `robots.txt.ts`, OGP/hreflang trong `Base.astro` | |
| Styling | **Vanilla CSS** (CSS nesting, custom properties) — `src/styles/{reset,base,layout,global}.css` | Font Noto Sans + Material Icons từ Google Fonts |
| Ảnh | `astro:assets` + `sharp` | |
| Lint/Format | **Biome 2.4** | `pnpm check` = `astro check && biome check --write .` |
| Test | **Vitest 4** — chỉ có 1 file `src/i18n/__tests__/i18n.test.ts` | |
| Ngôn ngữ | TypeScript 5.9 (`astro/tsconfigs/strict`), alias `@/*` | |
| Package manager | **pnpm 10.29**, Node 24 (`.node-version`) | |
| Hosting (của tác giả gốc) | **Cloudflare Pages** (`astro-cms-dpv.pages.dev`) — dùng Git integration của Pages, **không có workflow deploy trong repo** | |
| CI (GitHub Actions) | CodeQL, link checker (lychee), nén ảnh, PageSpeed, dọn cache | Không có job build/test! |

**Luồng hoạt động:**

```
Người viết ──> /admin (Sveltia CMS) ──OAuth──> sveltia-cms-auth Worker ──> GitHub repo (commit .mdx/.json)
                                                                              │
                                                             Cloudflare build (pnpm build) ──> dist/ ──> CDN
Người đọc ──> /  (JS redirect theo localStorage/navigator.language) ──> /en/ | /ja/ | ...
```

---

## 2. Phần dư thừa & đề xuất loại bỏ

### 2.1 Xoá hẳn (không ảnh hưởng tính năng)

| Đường dẫn | Lý do |
|---|---|
| `.github/FUNDING.yml`, `SECURITY.md`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` | Của tác giả gốc (yacosta738), dự án cá nhân không cần |
| `renovate.json` **hoặc** `.github/dependabot.yml` | Đang bật **cả 2 bot** → PR cập nhật trùng lặp. Remote đã có 2 branch `dependabot/*`. Giữ **một** (đề xuất: Dependabot, xoá `renovate.json`) |
| `.github/workflows/cleanup.yml` | Dọn cache cho PR — không cần với repo cá nhân |
| `.github/workflows/image-actions.yml` | `astro:assets` + sharp đã tối ưu ảnh lúc build; action này dùng `@main` (không pin) |
| `.github/workflows/pagespeed-insights.yml` | Hard-code URL `*.astro-cms-dpv.pages.dev` của tác giả gốc → sẽ luôn fail/đo sai site. Thay bằng Lighthouse sau khi deploy (xem mục 5) |
| `.github/workflows/links.yml`, `lychee.toml`, `.lycheeignore` | Tuỳ chọn. Workflow có bug (`steps.restore-cache` không tồn tại) và tự tạo issue. Nếu muốn giữ link-check thì chạy trên `dist/` sau build |
| `.pre-commit-config.yaml` | Cần Python `pre-commit`; hook `structure` dùng `sed -i ''` (chỉ chạy trên macOS) → hỏng trên Windows. Thay bằng `lefthook`/`simple-git-hooks` nếu cần |
| `biome_comment.patch` | File patch rác bị commit nhầm |
| `docs/structure.md`, `docs/hero.svg`, `docs/lighthouse.png`, script `structure` trong `package.json` | Tài liệu của template |
| `.devcontainer/` | Dùng image Node **20** (Astro ≥6 cần Node ≥22.12) và path sai (`cd /workspaces/astro`). Xoá, hoặc viết lại nếu bạn dùng Codespaces |
| `src/assets/images/DALL·E 2025-02-21 ... .webp`, `cloudflare-vs-laliga-2.webp`, `photo-1601987077677-...avif` | **Không được tham chiếu ở đâu**; tên file unicode dài gây phiền trên Windows |
| `src/assets/symbol.svg` | Không dùng |
| `src/components/OptimizedPicture.astro` | Không được import ở đâu |
| `src/pages/[lang]/monolingual.astro` + menu "Monolingual" trong `Header.astro` | Trang demo |
| `src/pages/<lang>/{setup,page,feature}.mdx` (15 file) | Đây là **tài liệu hướng dẫn template**, không phải nội dung của bạn. Thay bằng trang thật của bạn |
| Nội dung mẫu: `src/data/blog/**` (15 post "Lorem ipsum"), `authors/*/john-doe.json`, `tags/*/test.md`, `categories/*/test.md`, `src/assets/images/<lang>/*-post/`, `src/assets/<lang>/hero.svg` | Dữ liệu demo — giữ lại **1 post mẫu/ngôn ngữ** cho tới khi có nội dung thật, để content schema vẫn được kiểm tra khi build |

### 2.2 Quyết định về số lượng ngôn ngữ (ảnh hưởng lớn nhất)

5 ngôn ngữ nhân lên mọi thứ (5× post, 5× tag, 5× hero, bản dịch trong `src/i18n/translations/*.ts`, `consts.ts`, `Header.astro`, `public/admin/config.yml`). Nếu bạn chỉ cần ví dụ `vi` + `en`:

1. Sửa `src/i18n/locales.ts` (`LOCALES_SETTING`, `DEFAULT_LOCALE_SETTING`).
2. Sửa `initialUI` trong `src/i18n/ui.ts` (đang **hard-code** 5 ngôn ngữ — nên sinh từ `LOCALES`).
3. Sửa `i18n.locales` trong `public/admin/config.yml`.
4. Xoá thư mục ngôn ngữ thừa trong `src/data/**`, `src/assets/**`, `src/pages/<lang>/`.
5. Dọn key thừa trong `src/i18n/translations/*.ts`, `consts.ts`, các `t({ja:..., ...})` inline trong `Header.astro`.

Nếu chỉ cần **1 ngôn ngữ**, có thể bỏ luôn toàn bộ `src/i18n`, `src/components/i18n`, route `[lang]` và `src/pages/index.astro` (trang redirect bằng JS) — code đơn giản đi rất nhiều. Hãy quyết định việc này **trước** khi redesign.

### 2.3 Thay thế thông tin của tác giả gốc (bắt buộc)

| File | Cần sửa |
|---|---|
| `package.json` | `name`, `description`, `homepage`, `version`, đặt `"private": true` |
| `astro.config.mjs` | `site` |
| `src/consts.ts` | `BRAND_NAME`, `SITE_TITLE`, `SITE_DESCRIPTION`, `X_ACCOUNT`, `BASE_URL_PROD` (URL bị lặp với `astro.config.mjs` → nên dùng `import.meta.env.SITE` / `Astro.site` thay vì hard-code) |
| `public/admin/config.yml` | `backend.repo: yacosta738/astro-cms` → `harwellz/astro-sveltia`; `base_url` đang trỏ tới **OAuth Worker của người khác** → phải deploy Worker của riêng bạn (mục 5.4) |
| `src/layouts/Base.astro` | Comment "Source Code: github.com/yacosta738/astro-cms" |
| `src/components/Header.astro` | Text "i18n Starter", logo Astro, link GitHub |
| `README.md`, `LICENSE` | Viết lại README; LICENSE MIT phải giữ dòng copyright gốc, có thể thêm tên bạn |
| `public/ogp.png`, favicon | Thay bằng brand của bạn |

### 2.4 Bug phát hiện được trong lúc review (sửa luôn trong phase cleanup)

1. **Draft bị lộ ra trang danh sách blog** — `src/pages/[lang]/blog/index.astro:11` gọi `getCollection("blog")` **không lọc `draft`** (trang chi tiết và RSS thì có lọc). CMS mặc định `draft: true` → bài nháp vẫn hiện trong danh sách nhưng link 404.
2. **Icon 404** — `Base.astro` và `pages/index.astro` tham chiếu `/android-chrome.png` nhưng file thật là `public/android-icon.png`.
3. **Sai mã ngôn ngữ** — `src/data/categories/jp/internet.md` (phải là `ja/`), còn `ja/` thì thiếu `internet.md`.
4. `vitest.setup.ts` dùng `vi.stubGlobal("import.meta", ...)` — `import.meta` không phải biến global nên mock này không có tác dụng (test pass là nhờ may mắn). Nên dùng `vi.stubEnv()`.
5. `.npmrc` có `shamefully-hoist=true` + `strict-peer-dependencies=false` — che giấu lỗi phụ thuộc; nên bỏ sau khi upgrade.
6. `src/pages/admin.astro` pin Sveltia CMS **0.98.2** (bản mới nhất: **0.221.4**) và tải từ unpkg.
7. `sharp` nằm trong `devDependencies` — ổn cho SSG, nhưng `pnpm-workspace.yaml` cần tiếp tục cho phép build script của nó.

---

## 3. Kế hoạch upgrade dependencies

### 3.1 Hiện tại → mới nhất (npm, 2026-09-27)

| Package | Hiện tại | Mới nhất | Mức độ | Ghi chú |
|---|---|---|---|---|
| `astro` | 5.17.3 | **7.3.5** | 🔴 2 major | Cần Node ≥ 22.12 |
| `@astrojs/mdx` | 4.3.13 | **8.0.2** | 🔴 | peer `astro ^7.2.10` |
| `@astrojs/check` | 0.9.6 | 0.9.10 | 🟢 | peer `typescript ^5 \|\| ^6` |
| `@astrojs/rss` | 4.0.15 | 4.0.19 | 🟢 | |
| `@astrojs/sitemap` | 3.7.0 | 3.7.4 | 🟢 | |
| `@biomejs/biome` | 2.4.4 | 2.5.14 | 🟡 | chạy `biome migrate --write` |
| `vitest` | 4.0.18 | **5.0.2** | 🟡 major | |
| `typescript` | 5.9.3 | 7.0.2 (latest) | ⚠️ | **Dừng ở 6.0.3** — `@astrojs/check` chưa hỗ trợ TS 7 (native/Go port) |
| `sharp` | 0.35.0 | 0.35.4 | 🟢 | |
| `pnpm` | 10.29.3 | **12.6.0** | 🟡 2 major | đọc changelog v11/v12, cấu hình có thể phải chuyển từ `.npmrc` sang `pnpm-workspace.yaml` |
| Sveltia CMS (CDN) | 0.98.2 | 0.221.4 | 🟡 | kiểm tra lại `config.yml` sau khi nâng |
| GitHub Actions | `checkout@v7`, `cache@v5`… | | 🟢 | Dependabot lo |

Các breaking change đáng chú ý với **đúng codebase này**:

**Astro 5 → 6**
- Node 22.12+ (máy bạn đang Node 24.21 ✅; `.devcontainer` Node 20 ❌).
- Zod 4: đổi `import { z } from "astro:content"` → `import { z } from "astro/zod"` trong `src/content.config.ts`. Kiểm tra `lastModified: z.coerce.date().optional().default(...)` (hành vi `.default()` thay đổi trong Zod 4).
- Legacy content collections bị xoá — repo **đã dùng** `src/content.config.ts` + `glob()` loader + `render()` → ✅ gần như không phải sửa.
- `i18n.routing.redirectToDefaultLocale` mặc định `false` — repo đã set `false` ✅.

**Astro 6 → 7**
- **Rust compiler bắt buộc**, validate HTML nghiêm hơn: thẻ không đóng / lồng sai sẽ **lỗi build**. Rà các file `.astro` (đặc biệt `Base.astro`, `Article.astro`, `Header.astro`).
- `compressHTML` mặc định `'jsx'` → khoảng trắng giữa inline element có thể mất (ví dụ link + icon `material-icons-sharp`). Thêm `{" "}` hoặc set `compressHTML: true`.
- Markdown pipeline mặc định chuyển sang **Sätteri** (thay remark/rehype). Repo không có plugin remark/rehype tuỳ chỉnh → ✅.
- Vite 8.

### 3.2 Thứ tự thực hiện (mỗi bước = 1 commit, build xanh mới đi tiếp)

```
Bước 0  Baseline      pnpm install && pnpm build && pnpm test   → ghi lại kết quả, chụp màn hình vài trang
Bước 1  Patch/minor   @astrojs/check, rss, sitemap, sharp, biome 2.5 (+ biome migrate)
Bước 2  pnpm 12       corepack use pnpm@12 → cập nhật "packageManager", chuyển config .npmrc nếu cần, xoá shamefully-hoist
Bước 3  Astro 6       pnpm dlx @astrojs/upgrade (hoặc chỉ định astro@6 + mdx tương ứng) → sửa zod import → build
Bước 4  Astro 7       astro@7 + @astrojs/mdx@8 → sửa lỗi HTML strict, kiểm tra whitespace → build + so sánh trực quan
Bước 5  Tooling       vitest 5, typescript 6.0.3, sửa vitest.setup.ts
Bước 6  Sveltia CMS   nâng URL CDN lên bản mới, test /admin với local_backend
```

Lệnh hữu ích:

```bash
pnpm outdated                      # xem khác biệt
pnpm dlx @astrojs/upgrade          # tool chính thức nâng astro + integrations đồng bộ
pnpm add -D typescript@6           # KHÔNG dùng @latest cho TS
pnpm build && pnpm preview         # kiểm tra
```

> Trong Claude Code, có thể giao cho agent `ecc:build-error-resolver` (hoặc skill `/ecc:build-fix`) xử lý lỗi build sau mỗi bước upgrade — nó chỉ sửa tối thiểu để build xanh.

---

## 4. Multi-agent + taste-skill để redesign frontend

### 4.1 Cài taste-skill

Repo [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) là bộ Agent Skills hướng dẫn AI tránh UI "generic". Các skill đáng dùng cho project này:

| Skill (install name) | Dùng khi |
|---|---|
| `redesign-existing-projects` | **Bắt đầu từ đây** — audit UI hiện tại và đề xuất cải thiện |
| `design-taste-frontend` | Skill chính: layout variance, motion, density |
| `minimalist-ui` | Phong cách editorial/Notion — rất hợp blog |
| `high-end-visual-design` | Phong cách premium, tĩnh lặng |
| `full-output-enforcement` | Ép agent xuất code đầy đủ, không cắt `// ...` |

Cài (chạy trong thư mục project):

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "minimalist-ui"
```

Hoặc thủ công: copy thư mục skill (chứa `SKILL.md`) vào `.claude/skills/<tên>/`. Kiểm tra lại bằng cách gõ `/` trong Claude Code — skill mới sẽ xuất hiện. Nên commit `.claude/skills/` để mọi phiên làm việc dùng chung.

ECC (đã cài) cũng có sẵn các skill liên quan: `ecc:frontend-design-direction`, `ecc:taste`, `ecc:design-system`, `ecc:frontend-a11y`, `ecc:make-interfaces-feel-better`, và command `/ecc:gan-design` (vòng lặp generator ↔ evaluator có chấm điểm).

### 4.2 Quy trình multi-agent đề xuất

Nguyên tắc: **agent đọc/nghiên cứu thì chạy song song; agent sửa file thì tách theo vùng file hoặc dùng git worktree** để không ghi đè nhau.

```
Phase D1 — Research (song song, read-only)
  ├─ Agent A (Explore / ecc:code-explorer): map toàn bộ component, CSS token, layout
  ├─ Agent B (skill redesign-existing-projects): audit UI hiện tại → danh sách vấn đề
  └─ Agent C (ecc:a11y-architect): audit accessibility + RTL (tiếng Ả Rập)
        ▼
Phase D2 — Design direction (1 agent, bạn duyệt)
  └─ design-taste-frontend + minimalist-ui → DESIGN.md: typography, màu, spacing scale, motion, component list
        ▼  (bạn chốt DESIGN.md trước khi code)
Phase D3 — Implement (song song theo vùng, mỗi agent 1 worktree)
  ├─ Agent 1: design tokens — src/styles/*.css          (chạy TRƯỚC)
  ├─ Agent 2: layout/shell — Base.astro, Header.astro, Footer.astro
  ├─ Agent 3: trang blog — blog/index.astro, blog/[...id].astro, Article.astro
  └─ Agent 4: trang chủ + about + 404
        ▼
Phase D4 — Review & QA (song song, read-only)
  ├─ ecc:code-reviewer + ecc:typescript-reviewer
  ├─ ecc:a11y-architect (kiểm tra lại)
  └─ ecc:performance-optimizer / Lighthouse qua chrome-devtools MCP
```

Cách ra lệnh trong Claude Code (ví dụ prompt bạn gõ):

```text
Dùng 3 subagent chạy song song, chỉ đọc, không sửa file:
1) Explore: liệt kê toàn bộ component, layout, CSS custom properties và nơi dùng chúng
2) Áp dụng skill redesign-existing-projects để audit UI hiện tại (chạy pnpm dev, xem /en/ và /en/blog/)
3) ecc:a11y-architect audit WCAG 2.2 AA, chú ý RTL cho locale ar
Gộp kết quả thành docs/design-audit.md
```

```text
Dựa trên docs/design-audit.md, dùng skill design-taste-frontend + minimalist-ui viết DESIGN.md
(typography, palette light/dark, spacing, motion, danh sách component). Chưa code, chờ mình duyệt.
```

```text
Triển khai DESIGN.md bằng 4 subagent, mỗi agent dùng isolation worktree, phạm vi file:
- tokens: src/styles/**
- shell: src/layouts/Base.astro, src/components/Header.astro, Footer.astro
- blog: src/pages/[lang]/blog/**, src/layouts/Article.astro
- pages: src/pages/[lang]/index.astro, about.astro, 404.astro
Agent tokens chạy trước; 3 agent còn lại chạy song song sau đó. Mỗi agent chạy pnpm build trước khi xong.
```

Hoặc dùng command có sẵn của ECC: `/ecc:multi-frontend` (workflow frontend đa model) hoặc `/ecc:gan-design` (lặp đến khi đạt điểm).

Lưu ý thực tế:
- Mỗi subagent khởi động "lạnh" và tốn token — chỉ dùng song song khi các phần thật sự độc lập. Việc nhỏ thì để 1 agent làm.
- Chốt **design tokens trước**, các agent còn lại chỉ dùng token → tránh 4 agent tự bịa 4 bộ màu.
- Giữ Vanilla CSS (nhẹ, Lighthouse tốt) hoặc chuyển Tailwind v4 — quyết định trong DESIGN.md, đừng để agent tự chọn.
- Tự host font (`@fontsource/*` hoặc Astro Fonts API) thay vì Google Fonts → bớt 2 origin bên ngoài, tốt hơn khi đã có CDN Cloudflare.

---

## 5. Deployment & CI/CD

### 5.1 Hiện trạng

- Site gốc chạy trên **Cloudflare Pages** (`astro-cms-dpv.pages.dev`) bằng **Git integration của Cloudflare** (Cloudflare tự pull repo và chạy build). Trong repo **không có** `wrangler.toml`/`wrangler.jsonc` hay workflow deploy.
- Preview mỗi branch: `https://<branch>.astro-cms-dpv.pages.dev` — workflow PageSpeed đang đoán URL theo quy ước này.
- GitHub Actions hiện có **không build, không test, không lint**. CodeQL / link-check / nén ảnh / pagespeed chỉ là phụ trợ.
- Output là **static** (không adapter) → deploy lên Cloudflare **không cần** `@astrojs/cloudflare`.

Nghĩa là: bạn vẫn dùng Cloudflare, nhưng phải tạo project mới trên tài khoản của bạn và bổ sung CI kiểm tra chất lượng.

### 5.2 Đề xuất: Cloudflare Workers + Static Assets

Cloudflare hiện khuyến nghị **Workers (static assets)** cho project mới; Pages vẫn chạy nhưng tính năng mới tập trung vào Workers. Với site tĩnh, cả hai đều phục vụ từ CDN miễn phí.

Thêm `wrangler.jsonc` ở root:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "astro-sveltia",
  "compatibility_date": "2026-09-27",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  },
  "preview_urls": true
}
```

Thêm `public/_headers` để cache mạnh asset có hash:

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/admin/*
  X-Robots-Tag: noindex
```

Có thể thêm `public/_redirects` với `/ /en/ 302` nếu muốn bỏ trang redirect bằng JS (nhưng sẽ mất tính năng tự chọn ngôn ngữ theo trình duyệt — muốn giữ thì cần 1 Worker nhỏ đọc header `Accept-Language`; lúc đó mới cần thêm code server).

Nếu muốn giữ Cloudflare Pages cho đơn giản: build command `pnpm build`, output `dist`, env `NODE_VERSION=24` — không cần file nào khác.

### 5.3 Hai lựa chọn pipeline

**Option A — Cloudflare Workers Builds (Git integration) — khuyên dùng để bắt đầu**
- Dashboard → Workers & Pages → Create → Import repo `harwellz/astro-sveltia`.
- Build command `pnpm build`, deploy command `npx wrangler deploy`, production branch `main`.
- Branch khác (`dev`, `feat/*`) tự build và nhận **preview URL**; `dev` có URL alias cố định dạng `dev-astro-sveltia.<subdomain>.workers.dev`.
- GitHub Actions chỉ làm **CI** (lint/check/test/build) — không cần secret Cloudflare.

**Option B — GitHub Actions deploy (kiểm soát hoàn toàn)**
- Tắt Git integration, dùng `cloudflare/wrangler-action` với secret `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Deploy chỉ khi CI xanh; `dev` → `wrangler versions upload` (preview) hoặc Worker riêng `astro-sveltia-dev`; `main` → `wrangler deploy`.
- Hợp khi muốn chặn deploy nếu test fail, hoặc chạy Lighthouse sau deploy.

Workflow CI tối thiểu cho cả 2 option (`.github/workflows/ci.yml`):

```yaml
name: CI
on:
  push:
    branches: [dev, main]
  pull_request:
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome ci .
      - run: pnpm test
      - run: pnpm build          # đã bao gồm astro check
```

(Nâng version các action lên mới nhất khi tạo file — Dependabot sẽ lo phần tiếp theo.)

### 5.4 Sveltia CMS trên Cloudflare

1. Deploy Worker OAuth của riêng bạn: [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) (nút "Deploy to Cloudflare").
2. Tạo GitHub OAuth App, callback URL = `https://<worker-cua-ban>/callback`; đặt `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS` làm secret của Worker.
3. Sửa `public/admin/config.yml`: `repo: harwellz/astro-sveltia`, `base_url: https://<worker-cua-ban>`.
4. Mỗi lần lưu bài trong CMS = 1 commit vào branch `backend.branch` → kích hoạt build/deploy. Đặt `backend.branch: main` (bài viết lên thẳng prod) **hoặc** `dev` (duyệt ở staging rồi merge) — xem mục 6.
5. Kiểm tra `publish_mode: editorial_workflow` có được Sveltia bản mới hỗ trợ đầy đủ không (xem changelog Sveltia); nếu không thì dùng `draft: true` để ẩn bài.
6. Có thể bảo vệ `/admin` bằng **Cloudflare Access** (Zero Trust, miễn phí ≤50 user) — thêm một lớp bảo mật ngoài GitHub OAuth.

### 5.5 Domain

Gắn custom domain vào Worker (Settings → Domains & Routes) khi đã có. Sau đó cập nhật `site` trong `astro.config.mjs` — sitemap, RSS, canonical, hreflang đều phụ thuộc giá trị này.

---

## 6. Git workflow — mỗi phase commit & push lên dev/prod để test

### 6.1 Mô hình branch (đơn giản, hợp dự án cá nhân)

```
main  ──────●────────────────●──────────────●──────▶  PROD    (https://<domain>)
             ↖ PR/merge       ↖ PR/merge     ↖
dev   ──●──●──●──●──●──●──●──●──●──●──●──●──●──────▶  STAGING (dev-astro-sveltia.<sub>.workers.dev)
          ↖ feat/phase-1-cleanup  ↖ feat/phase-2-upgrade   (tuỳ chọn, preview URL riêng)
```

- `main` = production. Chỉ nhận merge từ `dev`. Bật branch protection: bắt buộc CI xanh, cấm force-push.
- `dev` = staging, luôn deploy được. Làm việc trực tiếp ở đây khi thay đổi nhỏ.
- `feat/<phase>` cho phase lớn/rủi ro (upgrade Astro 7, redesign) → có preview URL riêng, hỏng thì bỏ branch.

Khởi tạo:

```bash
git checkout -b dev && git push -u origin dev
# GitHub → Settings → Branches: protect main (require status check "CI / build")
# Đóng 2 branch dependabot cũ; thêm `target-branch: dev` vào dependabot.yml
```

### 6.2 Vòng lặp cho mỗi phase

```bash
git switch dev && git pull
git switch -c feat/phase-1-cleanup           # (tuỳ chọn)
# ... làm việc, commit nhỏ theo từng bước ...
pnpm build && pnpm test                      # chạy local trước khi push
git push -u origin feat/phase-1-cleanup      # → preview URL, CI chạy
# test trên preview → merge vào dev
git switch dev && git merge --ff-only feat/phase-1-cleanup && git push   # → staging
# test trên staging → release lên prod
gh pr create --base main --head dev --title "release: phase 1 cleanup"
gh pr merge --merge                          # → production
git tag v0.1.0 && git push --tags            # mốc để rollback
```

Rollback: Cloudflare dashboard → Deployments → rollback về bản trước (tức thì), hoặc `npx wrangler rollback`; sau đó `git revert` trên `dev` rồi release lại.

### 6.3 Quy ước commit

Dùng **Conventional Commits** — giúp đọc lịch sử và tự sinh changelog sau này:

```
chore(cleanup): remove template docs and demo pages
fix(blog): filter draft posts from blog index
build(deps): upgrade astro 5 → 6
refactor(content): import z from astro/zod
feat(ui): new design tokens
ci: add build/test workflow
```

Mỗi bước trong mục 3.2 = 1 commit riêng → nếu Astro 7 làm vỡ gì, `git bisect`/`git revert` chỉ đúng bước đó.

Trong Claude Code: `/ecc:prp-commit` (commit bằng mô tả tự nhiên), `/ecc:pr` (tạo PR), `/ecc:code-review` trước khi merge vào `main`.

---

## 7. Roadmap tổng hợp

| Phase | Nội dung | Branch | Kết quả kiểm tra |
|---|---|---|---|
| **0. Hạ tầng** | Tạo `dev`, thêm `ci.yml`, `wrangler.jsonc`, kết nối Cloudflare, protect `main` | `dev` | Site template gốc chạy trên staging + prod URL của bạn |
| **1. Cleanup** | Mục 2.1, 2.3, sửa bug 2.4, quyết định số ngôn ngữ (2.2) | `feat/phase-1-cleanup` | Build xanh, không còn tham chiếu `yacosta738`/`astro-cms-dpv` (`grep -r`) |
| **2. Upgrade** | Mục 3.2 bước 1→6 | `feat/phase-2-upgrade` | Build + test xanh, so sánh trực quan với staging cũ |
| **3. CMS** | Worker OAuth riêng, cập nhật `config.yml`, Sveltia bản mới | `dev` | Đăng nhập `/admin` trên staging, tạo bài nháp thử |
| **4. Redesign** | Mục 4 (D1 → D4) | `feat/phase-4-redesign` | Lighthouse ≥ 95 cả 4 mục, a11y AA, kiểm tra RTL nếu còn `ar` |
| **5. Go-live** | Custom domain, cập nhật `site`, `_headers`, Cloudflare Web Analytics | `main` | Sitemap/RSS/hreflang trỏ đúng domain |

> Vì sao Cleanup trước Upgrade: bớt file → bớt chỗ có thể vỡ khi lên Astro 7 (Rust compiler validate HTML nghiêm hơn).

---

## Phụ lục — file quan trọng cần nhớ

| File | Vai trò |
|---|---|
| `astro.config.mjs` | `site`, i18n routing, integrations |
| `src/content.config.ts` | Schema nội dung (phải khớp với `public/admin/config.yml`) |
| `public/admin/config.yml` | Cấu hình Sveltia CMS |
| `src/i18n/locales.ts` | Danh sách ngôn ngữ |
| `src/consts.ts` | Tên site, mô tả, URL |
| `src/layouts/Base.astro` | `<head>`, SEO, font, header/footer |
| `src/pages/[lang]/blog/*` | Danh sách & chi tiết bài viết |
