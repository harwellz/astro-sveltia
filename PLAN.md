# PLAN — astro-sveltia

> Nguồn: `Overview.md` (2026-09-27). Quy tắc chung cho agent: `CLAUDE.md`.
> **Trạng thái: ⏳ CHỜ DUYỆT** — chưa task nào được thực hiện. Cách chạy song song + cổng người: `ORCHESTRATION.md`.
>
> Ký hiệu: `[ ]` chưa làm · `[x]` xong · 🧑 = chủ repo tự làm (tài khoản, dashboard, duyệt) · 🤖 = agent làm được · ⛔ = cổng chặn, phải có người duyệt mới đi tiếp.
> Agent: khi hoàn thành một task, đánh `[x]` và commit thay đổi PLAN.md **cùng commit** với task đó.

---

## 0. Tóm tắt yêu cầu

1. Biến template `yacosta738/astro-cms` thành site cá nhân: bỏ phần thừa, thay danh tính tác giả gốc, sửa bug.
2. Upgrade toàn bộ dependencies lên mới nhất (Astro 5 → 7; TypeScript chỉ tới 6.x).
3. Deploy lên **Cloudflare** (CDN) với 2 môi trường: `dev` (staging) và `main` (production).
4. Redesign frontend bằng multi-agent + taste skills. **Không có công cụ sinh ảnh** → mọi nhu cầu ảnh được xuất thành **prompt file trong `prompts/images/`**, chủ repo tự render bên ngoài rồi thả ảnh vào đúng chỗ.
5. Mỗi phase: commit theo quy ước → push → kiểm tra trên preview/staging → release lên prod.

---

## 1. Quyết định cần chủ repo chốt

| # | Câu hỏi | Mặc định nếu không trả lời | Chặn phase |
|---|---|---|---|
| **D1** ✅ | Ngôn ngữ | **Chốt 2026-09-27:** thêm `vi` làm **mặc định, không prefix** (`/` = tiếng Việt), giữ `en es ja zh-cn ar` có prefix (`/en/…`). Giữ RTL cho `ar`. | Phase 2 |
| **D2** ✅ | Pipeline deploy | **Chốt:** A — Cloudflare Workers Builds | Phase 1 |
| **D3** ✅ | Branch CMS commit | **Chốt:** `dev` | Phase 4 |
| **D8** ✅ | Mục đích site | **Chốt:** Trang chủ = landing giới thiệu + **portfolio** + hub các bài nổi bật (không phải dạng news). Blog = bài viết chất lượng cao để kéo organic search → SEO là yêu cầu hạng nhất. | Phase 5 |
| **D9** ✅ | Color mode | **Chốt:** light + dark theo `prefers-color-scheme`, có nút chuyển thủ công | Phase 5 |
| **D4** | Hướng thẩm mỹ: `minimalist-ui` (editorial) · `high-end-visual-design` (premium) · `industrial-brutalist-ui` · để `design-taste-frontend` tự suy luận | Chốt ở cổng ⛔ P5.2 | Phase 5 |
| **D5** | Repo public hay private? (ảnh hưởng scope OAuth của CMS: `public_repo` vs `repo`) | Giữ như hiện tại | Phase 4 |
| **D6** | Có custom domain chưa? | Dùng `*.workers.dev` tới Phase 6 | Phase 6 |
| **D7** | Lưu taste skills thế nào? Hiện `.claude/skills/*` là **symlink tuyệt đối** tới `C:/Users/Harwell/...` → hỏng khi clone/CI/cloud agent | Chuyển thành **thư mục thật** trong `.claude/skills/`, gitignore `.agents/`, giữ `skills-lock.json` | Phase 0 |

---

## 2. Pattern có sẵn cần tuân theo (không tự chế pattern mới)

| Hạng mục | Nguồn | Pattern |
|---|---|---|
| Đặt tên | `src/components/i18n/LocaleSelect.astro`, `src/i18n/i18n.ts:16` | Component `PascalCase.astro`; helper `camelCase` (`useTranslations`) |
| Xử lý lỗi | `src/i18n/i18n.ts:35`, `src/content.config.ts:9-26` | Không throw ở runtime: dịch fallback `lang → DEFAULT_LOCALE → key`; dữ liệu sai do Zod schema chặn **lúc build** |
| Logging | `src/i18n/ui.ts:43-44` | Chỉ `console.log` trong `NODE_ENV === "development"` |
| Truy cập dữ liệu | `src/pages/[lang]/rss.xml.js:19`, `src/pages/[lang]/blog/[...id].astro:8` | `getCollection("blog", filter)` lọc `!data.draft` + locale qua `id.split("/")[0]`; quan hệ bằng `getEntry(ref)` |
| Route đa ngôn ngữ | `src/i18n/i18n.ts:126`, `src/pages/[lang]/monolingual.astro:8` | `export const getStaticPaths = () => localeParams` |
| Test | `src/i18n/__tests__/i18n.test.ts:1-30` | Vitest, `describe/test/expect`, `vi.mock("../ui")` để cô lập |

---

## 3. Chuẩn bị trước (Deployment & Git) — checklist chi tiết

Làm **trước Phase 1**, trừ khi có ghi chú khác. Mục 🧑 cần tài khoản/quyền của bạn, agent không làm thay được.

### 3.1 Máy local

- [ ] 🧑 **L1** Node 24 (`node -v` → hiện là 24.21 ✅). Chạy `corepack enable` để pnpm tự đúng version theo `packageManager`.
- [ ] 🧑 **L2** `gh auth login` rồi `gh auth status` báo đã login vào `github.com` với quyền `repo`, `workflow`.
- [ ] 🧑 **L3** Kiểm tra danh tính commit: `git config user.name` / `user.email` (hiện: `ilumi <pphan720@gmail.com>`).
- [x] 🤖 **L4** Thêm `.gitattributes` (`* text=auto eol=lf`, ảnh `binary`) — hiện `core.autocrlf=true` và Biome dùng LF → `biome ci` có thể fail. *(Task P0.3)*

### 3.2 GitHub

- [ ] 🤖 **G1** Tạo branch `dev` từ `main` và push. *(Task P0.6)*
- [ ] 🧑 **G2** Đóng/xoá 2 branch bot cũ trên remote: `dependabot/github_actions/all-actions-*`, `dependabot/npm_and_yarn/all-npm-*` (`git push origin --delete <branch>`).
- [ ] 🧑 **G3** Settings → General: bật **Automatically delete head branches**; bật **Allow merge commits** (dùng cho release PR `dev → main`); tuỳ chọn tắt squash/rebase để lịch sử thống nhất.
- [ ] 🧑 **G4** Settings → Rules → Rulesets, **sau khi Phase 1 đã có CI chạy ít nhất 1 lần** (để status check hiện ra trong danh sách):
  - `main`: Require a pull request · Require status checks `CI / build` · Block force pushes · Restrict deletions.
  - `dev`: Block force pushes · Restrict deletions · (tuỳ chọn) Require status check `CI / build`.
  - Nếu D3 = `main`: thêm bypass cho vai trò *Repository admin* để CMS commit được.
- [ ] 🧑 **G5** Settings → Actions → General: Workflow permissions = *Read repository contents* (mặc định an toàn).
- [ ] 🧑 **G6** (Chỉ khi D2 = B) Settings → Secrets → Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- [ ] 🧑 **G7** (Tuỳ chọn) Settings → Environments: `production` (required reviewer = bạn), `staging`.

### 3.3 Cloudflare

- [ ] 🧑 **C1** Có tài khoản Cloudflare; ghi lại **account subdomain** `<sub>.workers.dev` (Workers & Pages → Overview).
- [ ] 🧑 **C2** Cài GitHub App "Cloudflare Workers and Pages" với quyền truy cập repo `harwellz/astro-sveltia`.
- [ ] 🧑 **C3** (D2 = A) Workers & Pages → Create → **Import a repository** → chọn repo, sau khi `wrangler.jsonc` đã có trên `dev` (P1.2):
  - Project name: `astro-sveltia` (phải trùng `name` trong `wrangler.jsonc`)
  - Production branch: `main`
  - Build command: `pnpm build`
  - Deploy command: `npx wrangler deploy`
  - Non-production branch deploy command: `npx wrangler versions upload`
  - Bật **Builds for non-production branches**
  - Biến môi trường build: `NODE_VERSION=24`
  - Kiểm tra URL preview của `dev` (dạng `dev-astro-sveltia.<sub>.workers.dev`) — ghi lại để dùng cho P1 và CMS.
- [ ] 🧑 **C4** (D2 = B) Tạo API token theo template **Edit Cloudflare Workers**, lấy Account ID → điền vào G6.
- [ ] 🧑 **C5** (Phase 6, D6) Thêm domain vào Cloudflare, đổi nameserver, chờ zone Active.

### 3.4 Sveltia CMS (trước Phase 4)

- [ ] 🧑 **M1** Deploy Worker OAuth riêng từ `github.com/sveltia/sveltia-cms-auth` (nút *Deploy to Cloudflare*) → ghi lại URL `https://sveltia-cms-auth.<sub>.workers.dev`.
- [ ] 🧑 **M2** GitHub → Settings → Developer settings → **OAuth Apps** → New: Homepage = URL staging; Authorization callback = `<URL M1>/callback`.
- [ ] 🧑 **M3** Đặt secret cho Worker M1: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS` (domain staging + prod, cách nhau bằng dấu phẩy; xem README của sveltia-cms-auth về wildcard).
- [ ] 🧑 **M4** (Tuỳ chọn) Cloudflare Zero Trust → Access → Application cho path `/admin*`.

---

## 4. Quy ước Git (agents bắt buộc tuân theo)

> Bản gốc ở `CLAUDE.md` → mục *Git conventions*. Tóm tắt lại để đọc kèm task:

**Branch:** `main` (prod, chỉ merge từ `dev` qua PR, chủ repo duyệt) · `dev` (staging, luôn build được) · `phase/<n>-<slug>` cho mỗi phase, tách từ `dev` · `fix/<slug>`, `chore/<slug>` cho việc lẻ.

**Commit:** Conventional Commits, tiếng Anh, thể mệnh lệnh, subject ≤ 72 ký tự, footer `Refs: PLAN.md P<phase>.<task>`.

```
build(deps): upgrade astro 5 → 6

Zod 4 is now bundled; z is imported from astro/zod.
Refs: PLAN.md P3.3
```

- `type`: `feat fix refactor style perf test docs build ci chore revert` · `scope`: `blog content cms i18n layout ui styles seo assets deps ci deploy agents docs`
- 1 task = 1 commit. Không trộn cleanup / upgrade / redesign.
- Trước mỗi commit: `pnpm build && pnpm test && pnpm biome ci .` phải xanh. Không `--no-verify`, không `git add -A`.

**Vòng đời mỗi phase:**

```bash
git switch dev && git pull --ff-only
git switch -c phase/<n>-<slug>
# … từng task: sửa → validate → git add <paths> → git commit …
git push -u origin phase/<n>-<slug>          # 🤖 sau khi validation của phase xanh → Cloudflare build preview
# (tuỳ chọn) 🧑 xem preview URL
git switch dev && git merge --no-ff phase/<n>-<slug> && git push   # 🤖 khi CI xanh + reviewer PASS → staging
# 🧑 kiểm tra staging
gh pr create --base main --head dev --title "release: phase <n> <slug>" --body "<checklist phase>"   # 🤖
# ⛔ 🧑 duyệt & merge PR → production
git switch main && git pull && git tag v0.<n>.0 && git push origin v0.<n>.0   # 🤖/🧑
```

Tag: `v0.<phase>.0` cho mỗi release phase; go-live = `v1.0.0`. Rollback: Cloudflare → Deployments → Rollback (tức thì), sau đó `git revert` trên `dev` và release lại. Không bao giờ force-push `dev`/`main`.

---

## 5. Các phase

Mỗi phase ghi: branch · task (mã, file, cách kiểm tra, commit message) · tiêu chí xong · cổng duyệt.

### Phase 0 — Hạ tầng cho agent &nbsp;·&nbsp; branch: commit thẳng vào `main` lần cuối rồi tách `dev` &nbsp;·&nbsp; độ phức tạp: Thấp

Lý do commit thẳng vào `main`: chưa có `dev`, CI hay branch protection; đây là commit khởi tạo quy ước.

- [x] 🤖 **P0.1** Commit `Overview.md`, `CLAUDE.md`, `PLAN.md`. → `docs(agents): add overview, shared agent rules and plan`
- [x] 🤖 **P0.2** (D7) Thay symlink `.claude/skills/*` bằng thư mục thật (copy từ `.agents/skills/*`), thêm `.agents/` vào `.gitignore`, commit `.claude/skills/`, `.claude/settings.json`, `skills-lock.json`. Kiểm tra: `git ls-files -s .claude/skills | grep -c ^120000` = 0 (không còn symlink). → `chore(agents): vendor taste skills as regular files`
- [x] 🤖 **P0.3** Thêm `.gitattributes` (`* text=auto eol=lf`; `*.png *.jpg *.webp *.avif *.ico binary`), chạy `git add --renormalize .`, kiểm tra `pnpm biome ci .`. → `chore: enforce lf line endings`
- [x] 🤖 **P0.4** Tạo khung `prompts/images/` (xem §6): `README.md`, `_TEMPLATE.md`, thư mục `brand/`, `references/`, `assets/` (mỗi thư mục có `.gitkeep`) và `design/references/.gitkeep`. → `docs(assets): add image prompt workflow`
- [x] 🤖 **P0.5** Baseline: `pnpm install --frozen-lockfile && pnpm build && pnpm test`; ghi kết quả (pass/fail, thời gian build, số trang) vào cuối PLAN.md mục *Nhật ký*. Không sửa code. → `docs(agents): record baseline build`
- [ ] 🤖 **P0.6** `git push origin main` → `git switch -c dev && git push -u origin dev`.

**Xong khi:** remote có `main` + `dev`, skills là file thật, baseline đã ghi. ⛔ Không có cổng — đi tiếp Phase 1 khi §3.1–3.3 đã xong.

### Phase 1 — CI + deploy lên Cloudflare (template nguyên trạng) &nbsp;·&nbsp; branch: `phase/1-deploy` &nbsp;·&nbsp; độ phức tạp: Thấp–Trung bình

Mục tiêu: pipeline chạy được **trước** khi sửa code, để mọi phase sau đều có preview để kiểm tra.

- [ ] 🤖 **P1.1** Tạo `.github/workflows/ci.yml` (checkout → pnpm/action-setup → setup-node theo `.node-version` + cache pnpm → `pnpm install --frozen-lockfile` → `pnpm biome ci .` → `pnpm test` → `pnpm build`). Job tên `build`, workflow tên `CI`, trigger `push: [dev, main]` + `pull_request`. Dùng version action mới nhất tại thời điểm làm. → `ci: add build, lint and test workflow`
- [ ] 🤖 **P1.2** `pnpm add -D wrangler`; tạo `wrangler.jsonc` (`name: "astro-sveltia"`, `compatibility_date` = ngày làm, `assets.directory: "./dist"`, `assets.not_found_handling: "404-page"`, `preview_urls: true`). Kiểm tra: `pnpm build && pnpm wrangler dev` mở được `/en/`. → `build(deploy): add wrangler config for workers static assets`
- [ ] 🤖 **P1.3** `public/_headers`: `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`; `/admin/*` → `X-Robots-Tag: noindex`; header bảo mật cơ bản cho `/*` (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`). Kiểm tra: `dist/_headers` tồn tại sau build. → `feat(deploy): add cache and security headers`
- [ ] 🤖 **P1.4** Dependabot: thêm `target-branch: "dev"` cho cả 2 ecosystem; xoá `renovate.json`. → `ci: target dependabot at dev and drop renovate`
- [ ] 🤖 **P1.5** (Chỉ D2 = B) `.github/workflows/deploy.yml` dùng `cloudflare/wrangler-action`: chạy sau CI xanh; `dev` → `wrangler versions upload --preview-alias dev`, `main` → `wrangler deploy`. → `ci(deploy): deploy to cloudflare from actions`
- [ ] 🤖 Push `phase/1-deploy` → 🧑 làm **C3** (import repo) nếu chưa làm → kiểm tra CI xanh + preview URL chạy.
- [ ] 🧑 Làm **G4** (ruleset) — lúc này check `CI / build` đã xuất hiện.
- [ ] 🤖 Merge vào `dev` → staging chạy → release PR → ⛔ 🧑 merge → tag `v0.1.0`.

**Xong khi:** `main` → URL production, `dev` → URL staging, PR có CI chạy. Cả hai vẫn là template gốc — đúng như mong đợi.

### Phase 2 — Cleanup & sửa bug &nbsp;·&nbsp; branch: `phase/2-cleanup` &nbsp;·&nbsp; độ phức tạp: Trung bình &nbsp;·&nbsp; cần **D1**

- [x] 🤖 **P2.1** Xoá file meta của template: `.github/FUNDING.yml`, `SECURITY.md`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `biome_comment.patch`, `docs/`, script `structure` trong `package.json`, `.pre-commit-config.yaml`, `.devcontainer/`. → `chore(cleanup): remove template meta files`
- [x] 🤖 **P2.2** Xoá workflow thừa: `cleanup.yml`, `image-actions.yml`, `pagespeed-insights.yml`, `links.yml` + `lychee.toml`, `.lycheeignore`. Giữ `codeql.yml`, `ci.yml`. → `ci: remove template-specific workflows`
- [ ] 🤖 **P2.3** Xoá trang demo: `src/pages/[lang]/monolingual.astro`, `src/pages/<lang>/{setup,page,feature}.mdx`, các mục menu tương ứng trong `Header.astro`, component chỉ trang demo dùng (`LocaleSelectSingle.astro` nếu không còn ai import), `OptimizedPicture.astro`. Kiểm tra: `pnpm build`, grep không còn import tới file đã xoá. → `chore(cleanup): remove template documentation pages`
- [ ] 🤖 **P2.4** Xoá asset không dùng: 3 ảnh trong `src/assets/images/` không được tham chiếu (DALL·E…, `cloudflare-vs-laliga-2.webp`, `photo-1601987077677-…avif`), `src/assets/symbol.svg`. → `chore(assets): remove unused images`
- [ ] 🤖 **P2.5** (D1) **Thêm `vi` làm locale mặc định không prefix** — chạy SAU P2.1–P2.4, P2.6–P2.8 (đụng cùng file). Chia commit:
  - **P2.5a** Routing: `src/i18n/locales.ts` thêm `vi: { label: "Tiếng Việt", lang: "vi-VN" }` đứng đầu, `DEFAULT_LOCALE_SETTING = "vi"`; `astro.config.mjs` `routing.prefixDefaultLocale: false`; `src/i18n/types.ts` `SHOW_DEFAULT_LANG_IN_URL = false`; đổi thư mục `src/pages/[lang]/` → `src/pages/[...lang]/`, `getStaticPaths` trả `lang: undefined` cho `vi` + các locale khác (cập nhật `localeParams` trong `src/i18n/i18n.ts:126` để trả `lang: undefined` cho locale mặc định); xoá trang redirect JS `src/pages/index.astro` và `src/pages/404.astro` (thay bằng `[...lang]/404.astro` sinh ra `/404.html`); `LocaleSuggest` chỉ gợi ý, **không tự redirect** (tốt cho SEO). Test: `getLocalePaths` trả `/` cho vi và `/en/` cho en; `useTranslatedPath` không thêm prefix cho vi. → `feat(i18n)!: serve vietnamese at root without locale prefix`
  - **P2.5b** Nội dung & chuỗi: sinh `initialUI` trong `src/i18n/ui.ts` từ `LOCALES` (bỏ hard-code); thêm bản dịch `vi` cho mọi file `src/i18n/translations/*.ts`, `src/consts.ts`, object `t({...})` inline; thêm `src/data/{blog,authors,tags,categories}/vi/…` (1 post mẫu); test "mọi locale trong `LOCALES` có đủ key như locale mặc định". → `feat(i18n): add vietnamese translations and sample content`
  - **P2.5c** SEO/feeds: `sitemap` i18n map có `vi: "vi-VN"`; `hreflang="x-default"` trỏ bản `vi`; RSS: `/rss.xml` (vi) + `/<lang>/rss.xml`; link bài trong RSS dùng `getRelativeLocaleUrl`; `public/admin/config.yml` `i18n.locales` thêm `vi`, `default_locale: vi`. → `feat(seo): localize sitemap, hreflang and rss for default locale`
  - 🧑 **HG-10** Duyệt bản dịch tiếng Việt (agent dịch, bạn sửa câu chữ).
- [ ] 🤖 **P2.6** Dữ liệu mẫu: giữ 1 post/locale (đổi `john-doe` → tác giả thật, bỏ tag/category `test`), sửa `categories/jp/` → đúng locale. → `chore(content): trim sample content`
- [ ] 🤖 **P2.7** Thay danh tính: `package.json` (`name`, `description`, `homepage`, `version: 0.1.0`, `private: true`), `astro.config.mjs` `site` = URL production (C3), `src/consts.ts` (tên, mô tả, X account; bỏ `BASE_URL_PROD` hard-code → dùng `import.meta.env.SITE`), comment nguồn trong `Base.astro`, text/link trong `Header.astro`, `README.md` mới. Kiểm tra: `git grep -n -i "yacosta738\|astro-cms-dpv"` không còn kết quả (trừ `LICENSE`, `Overview.md`). → `chore: replace template identity with project identity`
- [ ] 🤖 **P2.8** Sửa bug:
  - Lọc `draft` + sắp xếp mới → cũ ở `src/pages/[lang]/blog/index.astro:11-13`. → `fix(blog): hide drafts and sort newest first on index`
  - `/android-chrome.png` → `/android-icon.png` trong `Base.astro`, `pages/index.astro`. → `fix(seo): correct android icon path`
  - `vitest.setup.ts`: bỏ `vi.stubGlobal("import.meta")`, dùng `vi.stubEnv`. → `test: use stubEnv for import.meta.env`
- [ ] 🤖 **P2.9** `.npmrc`: bỏ `shamefully-hoist` và `strict-peer-dependencies=false`, chạy `pnpm install`, sửa import thiếu nếu có. → `build(deps): stop hoisting dependencies`

**Xong khi:** build/test/biome xanh; grep danh tính cũ rỗng; preview không còn trang demo; không còn draft trong danh sách. Release → tag `v0.2.0`.

### Phase 3 — Upgrade dependencies &nbsp;·&nbsp; branch: `phase/3-upgrade` &nbsp;·&nbsp; độ phức tạp: Trung bình–Cao

Mỗi bước = 1 commit, `pnpm build && pnpm test` xanh mới sang bước sau. Lỗi build → dùng agent `ecc:build-error-resolver` (chỉ sửa tối thiểu). Trước P3.1 chụp màn hình `/en/`, `/en/blog/`, 1 bài viết trên staging để so sánh.

- [ ] 🤖 **P3.1** Patch/minor: `@astrojs/check@0.9.10`, `@astrojs/rss@4.0.19`, `@astrojs/sitemap@3.7.4`, `sharp@0.35.4`, `@biomejs/biome@2.5.14` + `pnpm biome migrate --write` (cập nhật `$schema` trong `biome.json`). → `build(deps): bump minor and patch dependencies`
- [ ] 🤖 **P3.2** pnpm 10 → 12: `corepack use pnpm@12.6.0`; đọc changelog v11/v12, chuyển cấu hình từ `.npmrc` sang `pnpm-workspace.yaml` nếu bắt buộc; giữ quyền build script cho `esbuild`, `sharp`. Kiểm tra CI vẫn cài được. → `build(deps): upgrade pnpm to 12`
- [ ] 🤖 **P3.3** Astro 5 → 6 (+ `@astrojs/mdx` bản tương thích astro 6): `pnpm dlx @astrojs/upgrade`; `src/content.config.ts` đổi `z` sang `import { z } from "astro/zod"`; kiểm tra `lastModified` `.optional().default()` với Zod 4 (post không có `lastModified` vẫn build và hiển thị đúng). → `build(deps): upgrade astro 5 → 6`
- [ ] 🤖 **P3.4** Astro 6 → 7 + `@astrojs/mdx@8`: sửa lỗi HTML nghiêm của Rust compiler; rà khoảng trắng do `compressHTML: 'jsx'` (link + icon `material-icons-sharp`) — thêm `{" "}` nơi cần; so sánh ảnh chụp. → `build(deps): upgrade astro 6 → 7`
- [ ] 🤖 **P3.5** `vitest@5`, `typescript@6.0.3` (**không** lên 7). → `build(deps): upgrade vitest 5 and typescript 6`
- [ ] 🤖 **P3.6** Cập nhật `engines.node` thành `>=22.12.0`; cập nhật mục *Stack* trong `CLAUDE.md` (Astro 7, pnpm 12…). → `docs(agents): update stack after upgrade`

**Xong khi:** `pnpm outdated` chỉ còn `typescript` (7.x, cố ý giữ lại); ảnh chụp trước/sau không lệch ngoài ý muốn. Release → `v0.3.0`.

### Phase 4 — Sveltia CMS của riêng bạn &nbsp;·&nbsp; branch: `phase/4-cms` &nbsp;·&nbsp; độ phức tạp: Thấp &nbsp;·&nbsp; cần **M1–M3, D3, D5**

- [ ] 🤖 **P4.1** `public/admin/config.yml`: `backend.repo: harwellz/astro-sveltia`, `backend.branch: <D3>`, `base_url: <URL M1>`; khớp lại `i18n.locales` với D1; field khớp `src/content.config.ts`. → `feat(cms): point cms to own repo and auth worker`
- [ ] 🤖 **P4.2** `src/pages/admin.astro`: nâng Sveltia lên bản mới nhất (0.221.x), xoá dòng Decap bị comment. Kiểm tra `publish_mode: editorial_workflow` còn được hỗ trợ; nếu không thì bỏ và dựa vào `draft`. → `build(cms): upgrade sveltia cms`
- [ ] 🧑 Kiểm tra trên staging: login `/admin` → tạo bài nháp → thấy commit trên branch D3 → build preview chạy → bài `draft: true` **không** xuất hiện ở danh sách/RSS.

**Xong khi:** CMS tạo/sửa được bài trên staging. Release → `v0.4.0`.

### Phase 5 — Redesign (multi-agent + taste skills + image prompts) &nbsp;·&nbsp; branch: `phase/5-redesign` &nbsp;·&nbsp; độ phức tạp: Cao

Chạy sau khi Phase 2 đã chốt ngôn ngữ và Phase 3 xong (Astro 7 validate HTML chặt hơn — redesign trên nền mới đỡ phải làm lại). **Riêng P5.1–P5.3 (tài liệu, không đụng code) được chạy song song với Phase 3–4** — xem `ORCHESTRATION.md`.

**P5.0 — Content model & SEO cho bài viết (logic, không phải giao diện)** — chạy song song với P5.2–P5.4
- [ ] 🤖 **P5.0a** Collection `projects` (portfolio): `src/content.config.ts` + `public/admin/config.yml` cùng commit. Field: `title`, `summary`, `role`, `year`, `stack: string[]`, `cover` (image), `links: { live?, repo?, caseStudy? }`, `featured: boolean`, `order: number`, `draft`, body. Dữ liệu `src/data/projects/<lang>/`. Blog thêm field tuỳ chọn `featured`, `ogImage`. Helper thuần `src/lib/content.ts` (`selectPosts`, `selectProjects`, `relatedPosts`, `readingTime`) có test. → `feat(content): add projects collection and content helpers`
- [ ] 🤖 **P5.0b** SEO bài viết: JSON-LD (`BlogPosting`, `BreadcrumbList`, `Person`/`WebSite` ở trang chủ) qua component `src/components/seo/JsonLd.astro`; `<link rel="canonical">`; `og:type=article`, `article:published_time/modified_time`, OG image = `ogImage ?? cover ?? /ogp.png`; mục lục tự sinh từ `headings` của `render()`; thời gian đọc; bài liên quan theo tag; sitemap `lastmod` từ `lastModified`. Test cho helper; kiểm tra bằng `dist/` (JSON-LD parse được). → `feat(seo): add structured data, canonical and article metadata`
- [ ] 🧑 **HG-8** Nội dung thật: hồ sơ tác giả (tên, bio, avatar), danh sách 3–6 dự án portfolio (có thể điền dần qua CMS). Không chặn — agent dùng dữ liệu mẫu ghi rõ `TODO`.

**P5.1 — Audit (3 agent song song, chỉ đọc)** → `docs/design/audit.md`
- [ ] 🤖 Agent `Explore`/`ecc:code-explorer`: bản đồ component, layout, CSS custom properties và nơi dùng.
- [ ] 🤖 Agent áp skill `redesign-existing-projects`: chạy `pnpm dev`, audit `/en/`, `/en/blog/`, 1 bài, `/en/about/`, 404 theo checklist của skill.
- [ ] 🤖 Agent `ecc:a11y-architect`: WCAG 2.2 AA, focus, contrast, RTL (nếu còn `ar`).
- Commit: `docs(ui): add design audit`

**P5.2 — Hướng thiết kế** → `DESIGN.md` &nbsp; ⛔ **cổng HG-5 (đầu vào) và HG-6 (duyệt)**
- [ ] 🧑 **HG-5** Thả ảnh chụp UX/UI bạn thích vào `design/inspiration/` và điền `design/BRIEF.md` (xem `design/inspiration/README.md`).
- [ ] 🤖 Main session (không phải subagent — skill taste cần hỏi đáp trực tiếp) đọc từng ảnh trong `design/inspiration/`, ghi phân tích vào `design/inspiration/ANALYSIS.md` (điều gì lấy, điều gì bỏ, vì sao), hỏi bạn tối đa 3 câu nếu ảnh mâu thuẫn nhau, rồi dùng `design-taste-frontend` (+ skill phong cách phù hợp nhất với ảnh — đây là D4) viết `DESIGN.md`: dòng *Design Read*, 3 dial (VARIANCE/MOTION/DENSITY), palette light/dark dưới dạng token, typography (font tự host — `@fontsource/*` hoặc Astro Fonts API, thay Google Fonts + Material Icons), thang spacing, radius, motion, danh sách component, sitemap các section cho từng trang.
- [ ] 🧑 Duyệt `DESIGN.md`. Commit: `docs(ui): add design system spec`

**P5.3 — Prompt ảnh (thay cho sinh ảnh)** → `prompts/images/**`
- [ ] 🤖 `brandkit` → `prompts/images/brand/` (logo, favicon, OG image mặc định).
- [ ] 🤖 `imagegen-frontend-web` (+ `imagegen-frontend-mobile` nếu cần) → `prompts/images/references/`: **1 prompt cho mỗi section** của mỗi trang, theo đúng quy tắc của skill (không gộp nhiều section vào 1 ảnh), cùng một palette lấy từ `DESIGN.md`.
- [ ] 🤖 Ảnh thật dùng trong site (hero, minh hoạ 404, cover mặc định cho blog, ảnh about) → `prompts/images/assets/`.
- [ ] 🤖 Cập nhật bảng mục lục trong `prompts/images/README.md`. Commit: `docs(assets): add image generation prompts`
- [ ] 🧑 (Tuỳ chọn, **không chặn**) Render bằng công cụ bên ngoài, thả file vào đúng `target`, đổi `status: rendered`. Nếu có ảnh reference, agent ở P5.5 phân tích ảnh đó theo quy trình của `image-to-code`; nếu không, agent làm theo `DESIGN.md`.

**P5.4 — Nền tảng (1 agent, chạy trước P5.5)** — scope: `src/styles/**`, `package.json` (font)
- [ ] 🤖 Tạo `src/styles/tokens.css` (màu, font, spacing, radius, motion, cả light/dark), viết lại `reset/base/layout.css` theo token, cài font tự host, bỏ link Google Fonts trong `Base.astro`. → `feat(styles): add design tokens and self-hosted fonts`

**P5.5 — Triển khai song song (3 agent, mỗi agent 1 worktree, chỉ sửa file trong scope)**

| Agent | Scope (chỉ sửa) | Commit |
|---|---|---|
| shell | `src/layouts/Base.astro`, `src/components/Header.astro`, `Footer.astro`, `src/components/i18n/**`, `src/i18n/translations/*` | `feat(layout): redesign site shell` |
| blog | `src/pages/[...lang]/blog/**`, `src/layouts/Article.astro`, `src/components/blog/**` (mới) | `feat(blog): redesign blog index and article` |
| pages | `src/pages/[...lang]/index.astro` (landing: giới thiệu + portfolio + bài nổi bật), `about.astro`, `404.astro`, `src/pages/[...lang]/projects/**` (mới — trang chi tiết dự án), `src/components/home/**`, `src/components/projects/**` (mới) | `feat(ui): redesign landing, portfolio, about and 404` |

Quy tắc cho cả 3: chỉ dùng token trong `tokens.css`; agent blog/pages cần chuỗi UI mới thì ghi vào báo cáo để agent shell (chủ sở hữu `src/i18n/translations/*`) thêm vào; ảnh chưa có thì dùng placeholder theo §6.3; kết thúc bằng `pnpm build` xanh. Agent điều phối merge 3 worktree vào `phase/5-redesign` theo thứ tự shell → blog → pages.

**P5.6 — Gắn ảnh thật** (lặp lại mỗi khi chủ repo thả thêm ảnh)
- [ ] 🤖 Thay placeholder bằng ảnh ở `target`, dùng `<Image>`/`<Picture>`, alt text lấy từ prompt file, đổi `status: integrated`. → `feat(assets): integrate <id> artwork`

**P5.7 — Review & QA (song song, chỉ đọc)**
- [ ] 🤖 `ecc:code-reviewer` + `ecc:typescript-reviewer` trên diff của phase.
- [ ] 🤖 `ecc:a11y-architect` kiểm tra lại; Lighthouse (chrome-devtools MCP) trên preview URL, mobile.
- [ ] 🤖 Sửa các phát hiện mức CRITICAL/HIGH, mỗi phát hiện 1 commit `fix(<scope>): …`.

**Xong khi:** Lighthouse mobile ≥ 95 cả 4 mục trên preview; không lỗi a11y mức AA; đủ các locale; `DESIGN.md` khớp code. Release → `v0.5.0`.

### Phase 6 — Go-live &nbsp;·&nbsp; branch: `phase/6-golive` &nbsp;·&nbsp; độ phức tạp: Thấp &nbsp;·&nbsp; cần **D6, C5**

- [ ] 🧑 Gắn custom domain vào Worker `astro-sveltia` (Settings → Domains & Routes).
- [ ] 🤖 **P6.1** `astro.config.mjs` `site` = domain thật. 🧑 thêm domain vào `ALLOWED_DOMAINS` (M3) và Homepage của OAuth App (M2). → `chore(seo): switch site url to custom domain`
- [ ] 🤖 **P6.2** Kiểm tra `sitemap-index.xml`, `/<lang>/rss.xml`, `robots.txt`, `hreflang`, OG image đều trỏ domain mới. → `fix(seo): …` nếu có lỗi
- [ ] 🧑 Bật Cloudflare Web Analytics (không cần cookie banner).
- [ ] 🤖 Release PR → ⛔ 🧑 merge → tag **`v1.0.0`**.

---

## 6. Quy trình prompt ảnh (`prompts/images/`)

### 6.1 Cấu trúc

```
prompts/images/
├── README.md          # quy trình + bảng mục lục (id | kind | status | target)
├── _TEMPLATE.md       # mẫu prompt file
├── brand/             # logo, favicon, OG image          (skill: brandkit)
├── references/        # mockup từng section để tham khảo  (skill: imagegen-frontend-web / -mobile)
└── assets/            # ảnh thật được ship trong site     (skill: imagegen-frontend-web, style theo DESIGN.md)

design/references/                      # ảnh reference đã render (không ship, chỉ để agent phân tích)
src/assets/images/site/                 # ảnh assets đã render (được astro:assets tối ưu)
src/assets/images/site/_placeholders/   # placeholder SVG cùng tỉ lệ
public/                                 # chỉ favicon / OG image (URL cố định)
```

Tên file: `<NN>-<page>-<section>.md`, ví dụ `references/01-home-hero.md`, `assets/03-blog-default-cover.md`, `brand/01-logo.md`.

### 6.2 `_TEMPLATE.md`

```markdown
---
id: ref-home-hero                 # kebab-case, duy nhất
kind: reference                   # reference | asset | brand
skill: imagegen-frontend-web
status: pending                   # pending → rendered → integrated  (hoặc rejected)
aspect_ratio: "16:9"
size: 1920x1080
format: png                       # reference: png · asset: webp/avif · logo: svg
target: design/references/01-home-hero.png
used_by:
  - src/pages/[...lang]/index.astro
locales: all                      # all | [en, vi] — ảnh có chữ thì mỗi locale 1 file
text_in_image: none               # none | ghi đúng chữ cần xuất hiện
created: 2026-09-27
---

## Prompt
<prompt đầy đủ, 1 đoạn, tiếng Anh, dùng được ngay cho ChatGPT / Gemini / Midjourney…>

## Negative prompt
<những thứ cần tránh — lấy từ phần anti-slop của skill>

## Palette & typography
<hex và tên font lấy từ DESIGN.md>

## Alt text
- en: …
- vi: …

## Integration notes
<vị trí, crop, cách responsive, gợi ý loading/eager>
```

### 6.3 Luật cho agent

1. Skill yêu cầu "generate image" → **viết prompt file**, không gọi công cụ, không dùng URL ảnh stock/picsum trong code commit.
2. Mỗi section = 1 prompt (đúng HARD OUTPUT RULE của `imagegen-frontend-web`). Mọi prompt trong một đợt dùng chung palette và typography từ `DESIGN.md`.
3. Ưu tiên ảnh **không có chữ** (chữ để HTML render → dịch được, SEO, a11y). Bắt buộc có chữ (logo) → ghi rõ `text_in_image`.
4. Không chờ ảnh: tạo `src/assets/images/site/_placeholders/<id>.svg` (khối màu token, đúng `aspect_ratio`) để layout không bị nhảy (CLS), import placeholder đó; khi ảnh thật có → task P5.6.
5. Ảnh reference được render → agent đọc ảnh (Read tool xem được ảnh), ghi nhận xét vào mục *Integration notes*, rồi code theo — tương đương bước "analyze" của `image-to-code`.

### 6.4 Chủ repo render ảnh

Mở prompt → copy mục *Prompt* (+ *Negative prompt*) sang công cụ sinh ảnh → xuất đúng `size`/`format` → lưu vào `target` → đổi `status: rendered` → commit `feat(assets): add rendered <id>` (hoặc nhờ agent) → agent làm P5.6.

---

## 7. Rủi ro

| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Astro 7 Rust compiler báo lỗi HTML hàng loạt | Trung bình | Cao | Cleanup trước để bớt file; upgrade từng major; `ecc:build-error-resolver` |
| Khoảng trắng inline bị mất (`compressHTML: 'jsx'`) làm vỡ giao diện âm thầm | Cao | Thấp | So sánh ảnh chụp trước/sau P3.4 |
| `@astrojs/check` không tương thích TS 7 | Chắc chắn nếu nâng | Cao | Ghim TS 6.0.3, ghi trong `CLAUDE.md` |
| pnpm 12 đổi cách đọc cấu hình → CI/Cloudflare cài lỗi | Trung bình | Trung bình | P3.2 là commit riêng, kiểm tra cả CI và Cloudflare build |
| Branch protection chặn CMS commit vào `main` | Cao nếu D3 = main | Trung bình | Mặc định D3 = `dev`; hoặc bypass cho admin (G4) |
| Symlink skill hỏng trên máy khác/cloud | Chắc chắn | Trung bình | P0.2 |
| CRLF làm `biome ci` fail trên Windows | Trung bình | Thấp | P0.3 `.gitattributes` |
| Agent song song ghi đè file chung | Trung bình | Trung bình | Scope file cố định, worktree riêng, mỗi file chung có đúng 1 owner |
| Ảnh chưa có làm treo phase redesign | Cao | Thấp | Placeholder + P5.6 tách riêng, không chặn release |
| Tính năng Workers Builds (preview alias, non-prod builds) khác mô tả | Thấp | Thấp | Kiểm tra trong dashboard ở C3; phương án dự phòng: D2 = B hoặc Cloudflare Pages |
| Sveltia bản mới đổi schema `config.yml` / bỏ `editorial_workflow` | Trung bình | Thấp | P4.2 kiểm tra changelog, test trên staging |

---

## 8. Ước lượng

| Phase | Độ phức tạp | Công agent | Việc của chủ repo |
|---|---|---|---|
| 0 Hạ tầng agent | Thấp | ~0.5 h | duyệt |
| 1 CI + Deploy | Thấp–TB | ~1 h | §3 (~1 h dashboard) |
| 2 Cleanup | TB | ~2–3 h | D1, kiểm tra preview |
| 3 Upgrade | TB–Cao | ~2–4 h | so sánh ảnh chụp |
| 4 CMS | Thấp | ~0.5 h | M1–M3 (~30 phút) |
| 5 Redesign | Cao | ~6–10 h | duyệt DESIGN.md, render ảnh (tuỳ chọn) |
| 6 Go-live | Thấp | ~0.5 h | domain, DNS |

---

## 9. Tiêu chí hoàn thành toàn dự án

- [ ] Mọi task `[x]`; mỗi phase có tag release trên `main`.
- [ ] CI xanh trên `main`; production chạy trên Cloudflare; `dev` có staging.
- [ ] `git grep -i "yacosta738\|astro-cms-dpv"` chỉ còn trong `LICENSE`/`Overview.md`.
- [ ] Deps mới nhất (trừ TypeScript giữ 6.x có lý do).
- [ ] Lighthouse mobile ≥ 95; WCAG 2.2 AA.
- [ ] Mọi prompt trong `prompts/images/` ở trạng thái `integrated` hoặc `rejected` (hoặc được ghi rõ là để sau).
- [ ] `CLAUDE.md` phản ánh đúng stack cuối cùng.

---

## Nhật ký

| Ngày | Phase | Ghi chú |
|---|---|---|
| 2026-09-27 | — | Tạo `Overview.md`, `CLAUDE.md`, `PLAN.md`. Chờ duyệt. |
| 2026-09-27 | — | Chốt D1 (vi mặc định không prefix, giữ 5 locale), D2=A, D3=dev, D8 (landing + portfolio + blog SEO), D9 (light/dark). Thêm P5.0 (projects + SEO). Tạo `ORCHESTRATION.md` (chia wave/agent/cổng người) và `design/` (brief + inspiration). |
| 2026-09-27 | 0 | **Baseline (P0.5)** trên `main` trước khi sửa code — Node 24.21.0, pnpm 10.29.3 (chạy qua `corepack pnpm`, máy chưa có `pnpm` trong PATH). `pnpm install --frozen-lockfile` ✅ 8s · `pnpm build` ✅ 8s, **58 trang**, `astro check` 0 error / 0 warning / 4 hint (unused `getEntry`/`getEntries` ở `blog/index.astro`, `pattern`/`options` ở `vitest.setup.ts`) · `pnpm test` ✅ 24/24 (1 file) · `pnpm biome ci .` trước P0.3: ❌ 54 error (gần hết do CRLF) → sau P0.3: ✅ 0 error, **88 warning** (chủ yếu `noUnusedImports/Variables` false-positive trong frontmatter `.astro` + `noImportantStyles` ở `reset.css`/`base.css`) — xử lý ở Phase 2. |
| 2026-09-27 | 0 | Wave 0: P0.1–P0.5 xong, nhánh `dev` đã tạo ở local; **push `main` + `dev` (P0.6) chờ chủ repo chạy**. Ngoài plan: loại `.claude/` + `skills-lock.json` khỏi Biome (file do công cụ quản lý); commit riêng `style(styles)` format `base.css` (lỗi format có sẵn của template). `git checkout-index -f` không ghi lại working tree CRLF trên Windows → đã chuyển tay CRLF→LF cho file có `w/crlf` (nội dung trùng index). |
