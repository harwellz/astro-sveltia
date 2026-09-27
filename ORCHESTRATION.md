# Plan-Orchestrate Result

**Plan**: `PLAN.md`
**Lang**: `typescript` (phát hiện từ `package.json`)
**ECC mode**: `plugin` (ECC 2.2.2 — agent dùng tiền tố `ecc:`)
**Steps**: 19 (S0–S18)
**Scope**: all

> ⚠️ **Lệnh `/ecc:orchestrate` không có trong ECC 2.2.2 đang cài** (chỉ còn trong docs dịch; plugin chỉ đăng ký `orch-*`). Vì vậy mỗi bước dưới đây được viết thành **prompt chạy thẳng trong Claude Code**: session chính làm *orchestrator*, gọi subagent theo đúng chuỗi (agent sau nhận HANDOFF của agent trước). Chuỗi agent vẫn chọn theo quy tắc của skill `plan-orchestrate`; chỗ nào lệch quy tắc đều ghi lý do ở *Chain rationale*.

---

## 1. Cách vận hành

```
Bạn ──(dán 1 dòng "Chạy Wave N")──> Session chính = ORCHESTRATOR
                                        │  đọc ORCHESTRATION.md + PLAN.md
                                        ├─ spawn track A (background, worktree riêng) ─ chain: agent1 → agent2 → …
                                        ├─ spawn track B (background, worktree riêng) ─ chain: …
                                        │  (track độc lập chạy song song; track phụ thuộc chờ)
                                        ├─ merge track → phase branch → push → CI/Cloudflare preview
                                        └─ gặp cổng người HG-n ──> ⛔ DỪNG, hỏi bạn, chờ "HG-n done"
```

- **Chỉ orchestrator nói chuyện với bạn.** Subagent chạm cổng người thì trả về `BLOCKED: HG-n — <cần gì>` rồi dừng; orchestrator in khối ⛔ (mục 3) và chờ. Track không phụ thuộc cổng đó vẫn chạy tiếp.
- **Branch cho track song song:** `track/<phase>-<tên>` tách từ `phase/<n>-<slug>`, orchestrator merge `--no-ff` về phase branch khi chain của track kết thúc bằng reviewer PASS + `pnpm build && pnpm test && pnpm biome ci .` xanh. (Không dùng `phase/1-deploy/ci` vì Git không cho vừa có ref `phase/1-deploy` vừa có thư mục con cùng tên.)
- **Merge vào `dev` là tự động** khi phase branch xanh CI; **release `dev → main` luôn chờ bạn** (HG-3). Kiểm tra preview của phase branch là tuỳ chọn — bạn kiểm tra chính ở staging.
- **Xung đột `pnpm-lock.yaml`:** không sửa tay — lấy bản của branch đích rồi chạy `pnpm install` và commit lại.

---

## 2. Dòng thời gian (wave) — đường găng in đậm

```
         W0        W1              W2a            W2b        W3                         W4                  W5                 W6          W7
Agent:  [S0] ─┬─> [S1]∥[S2] ──┐
              └─> [S3]∥[S4] ──┴─> merge ──> [S5] ──┬─> **[S6]→[S7]→[S8]** ──┬─> [S13] ─────────┐
                                                   ├─> [S9] (sau HG-4) ─────┘                   ├─> [S15a]∥[S15b]∥[S15c] ─> [S17]∥[S16] ─> [S18]
                                                   └─> [S10] audit ─> [S11]* ─> [S12]∥[S14] ─────┘
Bạn:    HG-0 ───────> HG-1, HG-2 ─> HG-3(v0.1)    HG-10, HG-3(v0.2)   HG-4 · HG-5 → HG-6          HG-7 (tuỳ chọn, bất kỳ lúc nào)   HG-3   HG-9
                           ▲ bạn có thể làm HG-4, HG-5, HG-8 NGAY TỪ BÂY GIỜ, song song với mọi wave
(* S11 chạy ở session chính vì cần hỏi đáp với bạn)
```

**Việc bạn nên làm ngay để agent không phải chờ:** HG-0 (tài khoản), HG-5 (ảnh + brief), HG-4 (OAuth CMS), HG-8 (nội dung thật). Các cổng này không phụ thuộc code.

---

## 3. Cổng người (Human Gates)

Khi tới cổng, orchestrator in đúng khối sau và **dừng các track phụ thuộc**:

```
⛔ HG-n — CẦN BẠN XỬ LÝ
Việc cần làm: <checklist>
Khi xong, trả lời: "HG-n done" + <thông tin cần gửi lại>
Trong lúc chờ vẫn chạy: <các track không phụ thuộc>
```

| Gate | Việc bạn làm (chi tiết ở PLAN §3) | Gửi lại cho agent | Chặn bước | Thời điểm sớm nhất |
|---|---|---|---|---|
| **HG-0** | L1–L3 (Node, `gh auth`, git identity), G2 (xoá branch dependabot cũ), G3, G5, C1 (tài khoản Cloudflare), C2 (cài GitHub App Cloudflare) | account subdomain `<sub>.workers.dev` | S1/S2 kiểm tra deploy | Ngay bây giờ |
| **HG-1** | C3: Import repo vào Cloudflare Workers Builds (sau khi S2 push `wrangler.jsonc`) | URL production + URL staging `dev` | Xác nhận W1; S4 điền `site` thật (trước đó dùng placeholder) | Sau S2 |
| **HG-2** | G4: Rulesets cho `main`/`dev` (sau khi CI chạy 1 lần) | "đã bật" | Release đầu tiên | Sau S1 push |
| **HG-3** | Kiểm tra staging → duyệt & merge release PR `dev → main` | "merged" (orchestrator tự tag `v0.n.0`) | Phase kế tiếp **không** bị chặn — chỉ chặn tag/release | Cuối mỗi phase |
| **HG-4** | M1–M3: Worker `sveltia-cms-auth`, GitHub OAuth App, secrets (M4 tuỳ chọn) | URL Worker OAuth | S9 | Sau HG-0 (C1) |
| **HG-5** | Thả ảnh UX/UI vào `design/inspiration/` + điền bảng ghi chú + `design/BRIEF.md` | "HG-5 done" | S11 | **Ngay bây giờ** |
| **HG-6** | Duyệt `DESIGN.md` (có thể yêu cầu sửa, lặp lại) | "approve" hoặc góp ý | S12, S14, S15 | Sau S11 |
| **HG-7** | (Tuỳ chọn, **không chặn**) Render ảnh từ `prompts/images/**`, lưu đúng `target`, đổi `status: rendered` | danh sách id đã render | S16 | Sau S12 |
| **HG-8** | (Không chặn) Hồ sơ tác giả, 3–6 dự án portfolio, thông tin liên hệ — điền `design/BRIEF.md` mục A hoặc qua CMS | — | Go-live (S18) | Ngay bây giờ |
| **HG-9** | C5: Custom domain + DNS, gắn domain vào Worker | domain | S18 | Bất kỳ lúc nào |
| **HG-10** | Duyệt bản dịch tiếng Việt do agent tạo (S5) | góp ý hoặc "ok" | Release phase 2 | Sau S5 |

---

## 4. Tổng quan các bước

| # | Bước | Wave | Branch / track | Tags | Chain | Phụ thuộc | Cổng |
|---|---|---|---|---|---|---|---|
| S0 | Bootstrap agent infra (P0.1–P0.6) | W0 | `main` → tạo `dev` | docs | `ecc:doc-updater` | — | — |
| S1 | CI workflow + dependabot (P1.1, P1.4) | W1 | `track/1-ci` | build | `ecc:build-error-resolver,ecc:code-reviewer` | S0 | HG-0, HG-2 |
| S2 | Wrangler + `_headers` (P1.2, P1.3) | W1 | `track/1-wrangler` | build, security | `ecc:build-error-resolver,ecc:security-reviewer` | S0 | HG-1 |
| S3 | Dọn file template + nội dung mẫu + `.npmrc` (P2.1, P2.2, P2.4, P2.6, P2.9) | W2a | `track/2-meta` | refactor | `ecc:refactor-cleaner,ecc:code-reviewer` | S0 | — |
| S4 | Xoá trang demo + danh tính + sửa bug (P2.3, P2.7, P2.8) | W2a | `track/2-identity` | refactor, impl | `ecc:refactor-cleaner,ecc:tdd-guide,ecc:typescript-reviewer` | S0 | (HG-1 cho URL) |
| S5 | `vi` mặc định không prefix (P2.5a–c) | W2b | `phase/2-cleanup` | migration | `ecc:architect,ecc:tdd-guide,ecc:typescript-reviewer` | S3, S4 | HG-10 |
| S6 | Upgrade minor + pnpm 12 (P3.1, P3.2) | W3 | `phase/3-upgrade` | migration, build | `ecc:build-error-resolver,ecc:typescript-reviewer` | S5 | — |
| S7 | Astro 5 → 6 (P3.3) | W3 | `phase/3-upgrade` | migration | `ecc:build-error-resolver,ecc:typescript-reviewer` | S6 | — |
| S8 | Astro 6 → 7 + vitest 5 + TS 6 (P3.4–P3.6) | W3 | `phase/3-upgrade` | migration | `ecc:build-error-resolver,ecc:typescript-reviewer` | S7 | HG-3 |
| S9 | Sveltia CMS riêng + test đồng bộ schema (P4.1, P4.2) | W3 | `phase/4-cms` | impl, security | `ecc:tdd-guide,ecc:typescript-reviewer,ecc:security-reviewer` | S5 | **HG-4** |
| S10 | Design audit (P5.1) | W3 | `phase/5-redesign` (chỉ docs) | review | *direct helpers* (mục 6) | S5 | — |
| S11 | Phân tích inspiration + `DESIGN.md` (P5.2) | W3 | `phase/5-redesign` | design | *session chính* + skill taste | S10 | **HG-5 → HG-6** |
| S12 | Prompt ảnh (P5.3) | W4 | `track/5-prompts` | docs | `ecc:doc-updater` | HG-6 | HG-7 |
| S13 | Collection `projects` + SEO bài viết (P5.0a, P5.0b) | W4 | `track/5-content` | impl | `ecc:tdd-guide,ecc:typescript-reviewer` | S8, S9 | HG-8 |
| S14 | Design tokens + font tự host (P5.4) | W4 | `track/5-tokens` | impl | *general-purpose* → `ecc:code-reviewer` | HG-6 | — |
| S15a | Redesign shell (P5.5) | W5 | `track/5-shell` | impl | *general-purpose* → `ecc:typescript-reviewer` | S13, S14 | — |
| S15b | Redesign blog (P5.5) | W5 | `track/5-blog` | impl | *general-purpose* → `ecc:typescript-reviewer` | S13, S14 | — |
| S15c | Redesign landing + portfolio + about + 404 (P5.5) | W5 | `track/5-pages` | impl | *general-purpose* → `ecc:typescript-reviewer` | S13, S14 | — |
| S16 | Gắn ảnh thật (P5.6, lặp) | W6 | `track/5-assets` | impl | *general-purpose* → `ecc:code-reviewer` | HG-7 | — |
| S17 | Review & QA (P5.7) | W6 | `phase/5-redesign` | review | `ecc:typescript-reviewer,ecc:code-reviewer` + *direct helpers* | S15a–c | HG-3 |
| S18 | Go-live (P6) | W7 | `phase/6-golive` | review | `ecc:code-reviewer` + `ecc:seo-specialist` | S17 | **HG-9**, HG-3 |

---

## 5. Chi tiết từng bước

### S0 — Bootstrap agent infra

**Intent**: Commit tài liệu, chuyển skills thành file thật, thêm `.gitattributes`, tạo khung `prompts/images/`, ghi baseline build, tạo `dev`.
**Tags**: docs
**Chain rationale**: Chủ yếu là thao tác git tuần tự trên `main` — orchestrator tự làm; `ecc:doc-updater` chỉ viết `prompts/images/README.md` + `_TEMPLATE.md` theo PLAN §6.

```text
[Plan: PLAN.md#phase-0] Orchestrator thực hiện P0.1→P0.6 tuần tự trên main; gọi ecc:doc-updater viết prompts/images/README.md và _TEMPLATE.md đúng PLAN §6.1–6.2. Acceptance: git ls-files -s .claude/skills không còn mode 120000; pnpm build && pnpm test đã chạy và kết quả ghi vào Nhật ký PLAN.md; remote có main và dev.
```

### S1 — CI workflow + dependabot

**Intent**: Thêm `.github/workflows/ci.yml` (lint, test, build) và hướng Dependabot vào `dev`, bỏ Renovate.
**Tags**: build (CI)
**Chain rationale**: Tag `impl` bị bỏ qua có chủ đích — viết YAML không cần TDD. `build-error-resolver` tạo workflow và làm CI xanh; `code-reviewer` đóng chain.

```text
[Plan: PLAN.md#P1.1] Chạy tuần tự ecc:build-error-resolver → ecc:code-reviewer trong worktree branch track/1-ci: tạo .github/workflows/ci.yml (workflow CI, job build: checkout, pnpm/action-setup, setup-node theo .node-version + cache pnpm, install --frozen-lockfile, biome ci, test, build; trigger push dev/main + pull_request, action version mới nhất); thêm target-branch dev vào .github/dependabot.yml; xoá renovate.json. Acceptance: YAML hợp lệ; các lệnh trong workflow chạy xanh local; commit theo Conventional Commits.
```

### S2 — Wrangler + `_headers`

**Intent**: Cấu hình Cloudflare Workers static assets và header cache/bảo mật.
**Tags**: build, security
**Chain rationale**: `security-reviewer` đóng chain vì `_headers` là bề mặt bảo mật (noindex admin, nosniff, referrer).

```text
[Plan: PLAN.md#P1.2] Chạy tuần tự ecc:build-error-resolver → ecc:security-reviewer trong worktree branch track/1-wrangler: pnpm add -D wrangler; tạo wrangler.jsonc (name astro-sveltia, compatibility_date hôm nay, assets.directory ./dist, not_found_handling 404-page, preview_urls true); tạo public/_headers theo P1.3. Acceptance: pnpm build tạo dist/_headers; pnpm wrangler dev phục vụ được /en/; không header nào chặn /admin hoạt động.
```

### S3 — Dọn file template

**Intent**: Xoá meta/workflow/asset thừa, cắt nội dung mẫu còn 1 bài/locale, bỏ hoisting trong `.npmrc`.
**Tags**: refactor (cleanup)
**Chain rationale**: Chỉ xoá, không có quyết định kiến trúc → bỏ `architect` (lệch quy tắc có chủ đích để tiết kiệm). `code-reviewer` đóng chain vì phần lớn không phải TypeScript.

```text
[Plan: PLAN.md#P2.1] Chạy tuần tự ecc:refactor-cleaner → ecc:code-reviewer trong worktree branch track/2-meta: thực hiện P2.1, P2.2, P2.4, P2.6, P2.9 đúng danh sách file trong PLAN; mỗi task 1 commit. KHÔNG sửa Header.astro, Base.astro, src/pages/** (thuộc S4). Acceptance: pnpm build && pnpm test && pnpm biome ci . xanh; git grep không còn import tới file đã xoá; .npmrc không còn shamefully-hoist.
```

### S4 — Xoá trang demo + danh tính + sửa bug

**Intent**: Bỏ trang hướng dẫn template, thay danh tính tác giả gốc, sửa bug draft/sort, icon 404, mock `import.meta`.
**Tags**: refactor, impl (fix)
**Chain rationale**: `refactor-cleaner` xoá trang; `tdd-guide` viết test hồi quy cho helper lọc/sắp xếp bài (`selectPosts` trong `src/lib/content.ts`) trước khi sửa; `typescript-reviewer` đóng chain.

```text
[Plan: PLAN.md#P2.3] Chạy tuần tự ecc:refactor-cleaner → ecc:tdd-guide → ecc:typescript-reviewer trong worktree branch track/2-identity: P2.3, P2.7, P2.8. Tách logic lọc draft + sort mới→cũ vào hàm thuần có test. site URL chưa biết thì dùng TODO(HG-1); tên/tagline chưa có thì TODO(HG-8). Acceptance: test hồi quy draft/sort pass; git grep -i yacosta738 và astro-cms-dpv chỉ còn trong LICENSE/Overview.md; pnpm build xanh.
```

### S5 — `vi` mặc định không prefix

**Intent**: Thêm `vi` làm locale mặc định phục vụ tại `/`, giữ 5 locale còn lại có prefix; dịch UI; SEO/feeds theo locale.
**Tags**: migration
**Chain rationale**: Đổi cấu trúc route toàn site → `architect` lập phương án (`[lang]` → `[...lang]`, 404, redirect), `tdd-guide` khoá hành vi bằng test (`getLocalePaths`, `useTranslatedPath`, đủ key dịch), `typescript-reviewer` đóng chain. Sau đó gọi thêm `ecc:seo-specialist` (read-only) soát hreflang/sitemap.

```text
[Plan: PLAN.md#P2.5] Chạy tuần tự ecc:architect → ecc:tdd-guide → ecc:typescript-reviewer trên branch phase/2-cleanup (sau khi merge S3, S4): thực hiện P2.5a (routing prefixDefaultLocale false, src/pages/[...lang]/, bỏ redirect JS), P2.5b (bản dịch vi + nội dung mẫu vi), P2.5c (sitemap, hreflang x-default, RSS, CMS i18n) — 3 commit. Acceptance: / render tiếng Việt, /en/ render tiếng Anh, không còn /vi/; test i18n pass; dist có /404.html và /en/404.html. Sau đó BLOCKED: HG-10 để chủ repo duyệt bản dịch.
```

### S6 — Upgrade minor + pnpm 12

**Intent**: Nâng các gói patch/minor, Biome 2.5 (migrate), pnpm 12.
**Tags**: migration, build
**Chain rationale**: Không cần `architect`/`tdd-guide` (không đổi hành vi); `build-error-resolver` nâng và sửa lỗi build, `typescript-reviewer` đóng chain. `docs-lookup` bị bỏ vì Context7 MCP không được cài — breaking change đã ghi sẵn trong PLAN/Overview.

```text
[Plan: PLAN.md#P3.1] Chạy tuần tự ecc:build-error-resolver → ecc:typescript-reviewer trên branch phase/3-upgrade: P3.1 (minor/patch + biome migrate --write) rồi P3.2 (corepack use pnpm@12.6.0, chuyển config .npmrc sang pnpm-workspace.yaml nếu pnpm yêu cầu, giữ build script esbuild/sharp) — 2 commit. Acceptance: pnpm install --frozen-lockfile, build, test, biome ci đều xanh; packageManager = pnpm@12.6.0.
```

### S7 — Astro 5 → 6

**Intent**: Nâng Astro 6 + mdx tương thích, đổi import Zod.
**Tags**: migration
**Chain rationale**: như S6; chạy riêng để 1 major = 1 commit, dễ revert.

```text
[Plan: PLAN.md#P3.3] Chạy tuần tự ecc:build-error-resolver → ecc:typescript-reviewer trên branch phase/3-upgrade: pnpm dlx @astrojs/upgrade tới astro 6 + @astrojs/mdx tương thích; src/content.config.ts import z từ astro/zod; kiểm tra lastModified .optional().default() với Zod 4. Acceptance: build + test xanh; bài không có lastModified vẫn build; 1 commit build(deps): upgrade astro 5 → 6.
```

### S8 — Astro 6 → 7 + vitest 5 + TypeScript 6

**Intent**: Nâng Astro 7 (Rust compiler, compressHTML jsx, Sätteri), mdx 8, vitest 5, TS 6.0.3; cập nhật `engines` và `CLAUDE.md`.
**Tags**: migration
**Chain rationale**: như S6. Sau chain, orchestrator chụp ảnh `/`, `/blog/`, 1 bài (chrome-devtools MCP) so với ảnh chụp trước S6.

```text
[Plan: PLAN.md#P3.4] Chạy tuần tự ecc:build-error-resolver → ecc:typescript-reviewer trên branch phase/3-upgrade: P3.4 (astro 7 + @astrojs/mdx 8; sửa HTML sai do Rust compiler; thêm {\" \"} nơi mất khoảng trắng), P3.5 (vitest 5, typescript 6.0.3 — KHÔNG lên 7), P3.6 (engines.node >=22.12.0, cập nhật mục Stack trong CLAUDE.md) — 3 commit. Acceptance: pnpm outdated chỉ còn typescript 7.x; build/test/biome xanh; ảnh chụp trước/sau không lệch ngoài ý muốn.
```

### S9 — Sveltia CMS riêng

**Intent**: Trỏ CMS về repo + OAuth Worker của bạn, nâng Sveltia, thêm test bảo đảm `config.yml` khớp `content.config.ts`.
**Tags**: impl, security (auth)
**Chain rationale**: Quy tắc `impl + security` → `tdd-guide,<lang>-reviewer,security-reviewer`. `tdd-guide` viết test đồng bộ schema (parse YAML — thêm devDependency `yaml`, ghi lý do trong commit body).

```text
[Plan: PLAN.md#P4.1] Chạy tuần tự ecc:tdd-guide → ecc:typescript-reviewer → ecc:security-reviewer trong worktree branch phase/4-cms: trước tiên nếu chưa có URL Worker OAuth thì trả BLOCKED: HG-4. Thực hiện P4.1 (repo harwellz/astro-sveltia, branch dev, base_url, locales có vi mặc định), P4.2 (Sveltia bản mới nhất, xác minh editorial_workflow); thêm test so khớp collections/fields/locales giữa public/admin/config.yml và src/content.config.ts. Acceptance: test đồng bộ pass; không còn yacosta738 trong config.yml; build xanh.
```

### S10 — Design audit

**Intent**: Bản đồ UI hiện tại + audit theo `redesign-existing-projects` + a11y/SEO, gộp vào `docs/design/audit.md`.
**Tags**: review
**Chain rationale**: Cần agent ngoài catalogue của skill (catalogue không có agent frontend/a11y) → 3 *direct helpers* read-only chạy song song (mục 6), orchestrator gộp kết quả.

```text
[Plan: PLAN.md#P5.1] Orchestrator chạy song song 3 agent read-only: Explore (map component/layout/CSS custom properties), general-purpose đọc .claude/skills/redesign-existing-projects/SKILL.md rồi audit /, /blog/, 1 bài, /about/, 404 trên pnpm dev, ecc:a11y-architect (WCAG 2.2 AA + RTL ar); gộp vào docs/design/audit.md. Acceptance: audit liệt kê vấn đề theo trang + mức độ; commit docs(ui): add design audit.
```

### S11 — Inspiration → `DESIGN.md` (session chính)

**Intent**: Đọc ảnh bạn gửi + brief, viết `ANALYSIS.md` rồi `DESIGN.md`.
**Tags**: design
**Chain rationale**: Quy tắc gợi ý `planner,architect` nhưng cả hai là agent **chỉ đọc** và không hỏi được bạn; skill `design-taste-frontend` yêu cầu hỏi đáp trực tiếp → chạy ở session chính.

```text
[Plan: PLAN.md#P5.2] Orchestrator: nếu design/inspiration/ chưa có ảnh hoặc design/BRIEF.md trống mục A–C thì in khối ⛔ HG-5 và chờ. Sau đó đọc từng ảnh, viết design/inspiration/ANALYSIS.md, hỏi tối đa 3 câu nếu ảnh mâu thuẫn, dùng skill design-taste-frontend + skill phong cách hợp nhất (D4) viết DESIGN.md (Design Read, 3 dial, token light/dark, font hỗ trợ tiếng Việt + fallback CJK/Arabic, spacing, motion, section map từng trang). Acceptance: DESIGN.md đủ mục trên; ⛔ HG-6 được bạn approve.
```

### S12 — Prompt ảnh

**Intent**: Viết prompt ảnh brand / reference / asset theo `DESIGN.md`.
**Tags**: docs
**Chain rationale**: Chỉ tạo tài liệu → `doc-updater`; agent tự đọc file SKILL.md vì không có công cụ Skill.

```text
[Plan: PLAN.md#P5.3] Chạy ecc:doc-updater trong worktree branch track/5-prompts: đọc DESIGN.md, design/inspiration/ANALYSIS.md, .claude/skills/brandkit/SKILL.md, imagegen-frontend-web/SKILL.md; viết prompt vào prompts/images/{brand,references,assets}/ theo _TEMPLATE.md — 1 prompt/section, chung palette, ưu tiên ảnh không chữ, alt text đủ 6 locale; cập nhật bảng mục lục README. Acceptance: mọi file có frontmatter hợp lệ và status pending; commit docs(assets): add image generation prompts.
```

### S13 — Collection `projects` + SEO bài viết

**Intent**: Content model cho portfolio và các tính năng SEO/đọc bài (JSON-LD, canonical, OG, TOC, thời gian đọc, bài liên quan).
**Tags**: impl
**Chain rationale**: Logic thuần + schema → `tdd-guide` (helper `src/lib/content.ts` có test) rồi `typescript-reviewer`. Sau đó orchestrator gọi `ecc:seo-specialist` (read-only) soát `dist/`.

```text
[Plan: PLAN.md#P5.0] Chạy tuần tự ecc:tdd-guide → ecc:typescript-reviewer trong worktree branch track/5-content: P5.0a (collection projects ở content.config.ts + config.yml cùng commit, helper selectPosts/selectProjects/relatedPosts/readingTime có test, dữ liệu mẫu TODO(HG-8)) và P5.0b (JsonLd.astro, canonical, og article, TOC, reading time, related posts, sitemap lastmod). Chỉ thêm logic/markup tối thiểu, không styling. Acceptance: test helper pass; JSON-LD trong dist parse được; build xanh.
```

### S14 — Design tokens + font

**Intent**: `src/styles/tokens.css`, viết lại CSS nền theo token, font tự host.
**Tags**: impl
**Chain rationale**: Catalogue không có agent frontend → `general-purpose` (đọc `DESIGN.md` + skill) viết, `ecc:code-reviewer` đóng chain. Chạy trước S15 để 3 agent sau chỉ dùng token.

```text
[Plan: PLAN.md#P5.4] Chạy general-purpose → ecc:code-reviewer trong worktree branch track/5-tokens, scope chỉ src/styles/** và package.json: tạo tokens.css (màu light/dark theo prefers-color-scheme + data-theme, font, spacing, radius, motion) đúng DESIGN.md, viết lại reset/base/layout.css dùng token, cài font tự host hỗ trợ tiếng Việt. Không sửa .astro. Acceptance: không còn giá trị màu hard-code ngoài tokens.css; build xanh.
```

### S15a / S15b / S15c — Redesign song song

**Intent**: Triển khai giao diện theo `DESIGN.md`, mỗi agent một vùng file (PLAN P5.5).
**Tags**: impl
**Chain rationale**: `general-purpose` (có công cụ Skill → dùng `design-taste-frontend` + skill phong cách + `full-output-enforcement`) viết, `typescript-reviewer` đóng chain. Orchestrator merge theo thứ tự shell → blog → pages.

```text
[Plan: PLAN.md#P5.5-shell] Chạy general-purpose → ecc:typescript-reviewer trong worktree branch track/5-shell, scope: src/layouts/Base.astro, src/components/Header.astro, Footer.astro, src/components/i18n/**, src/i18n/translations/*: redesign shell theo DESIGN.md (nút theme light/dark, bỏ Google Fonts/Material Icons, logical CSS cho RTL), nhận chuỗi UI mới từ báo cáo của blog/pages. Acceptance: chỉ dùng token; a11y focus/landmark đúng; build xanh.
```

```text
[Plan: PLAN.md#P5.5-blog] Chạy general-purpose → ecc:typescript-reviewer trong worktree branch track/5-blog, scope: src/pages/[...lang]/blog/**, src/layouts/Article.astro, src/components/blog/**: redesign danh sách bài và trang đọc theo DESIGN.md, ưu tiên trải nghiệm đọc bài dài (độ rộng dòng ~65ch, TOC, code block, bài liên quan từ S13); ảnh chưa có dùng placeholder theo PLAN §6.3; chuỗi UI mới ghi vào báo cáo. Acceptance: chỉ dùng token; không sửa file ngoài scope; build xanh.
```

```text
[Plan: PLAN.md#P5.5-pages] Chạy general-purpose → ecc:typescript-reviewer trong worktree branch track/5-pages, scope: src/pages/[...lang]/index.astro, about.astro, 404.astro, src/pages/[...lang]/projects/**, src/components/home/**, src/components/projects/**: landing = giới thiệu + portfolio (projects featured) + bài nổi bật, không dạng news; trang chi tiết dự án; about; 404; placeholder ảnh theo PLAN §6.3. Acceptance: chỉ dùng token; không sửa file ngoài scope; build xanh.
```

### S16 — Gắn ảnh thật

**Intent**: Thay placeholder bằng ảnh bạn đã render (lặp lại mỗi lần HG-7).
**Tags**: impl
**Chain rationale**: Việc nhỏ, rõ ràng → `general-purpose` rồi `ecc:code-reviewer`.

```text
[Plan: PLAN.md#P5.6] Chạy general-purpose → ecc:code-reviewer trong worktree branch track/5-assets: với mỗi prompt status rendered, thay placeholder bằng file ở target qua <Image>/<Picture>, alt text từ prompt file, đổi status integrated. Acceptance: không còn import placeholder cho id đã integrated; build xanh; 1 commit mỗi id.
```

### S17 — Review & QA

**Intent**: Review code của phase 5, a11y, Lighthouse, sửa lỗi CRITICAL/HIGH.
**Tags**: review
**Chain rationale**: `review` → `<lang>-reviewer,code-reviewer`; song song thêm `ecc:a11y-architect` và Lighthouse (chrome-devtools MCP ở session chính).

```text
[Plan: PLAN.md#P5.7] Chạy tuần tự ecc:typescript-reviewer → ecc:code-reviewer trên diff phase/5-redesign so với dev; song song ecc:a11y-architect và Lighthouse mobile trên preview URL. Orchestrator sửa phát hiện CRITICAL/HIGH, mỗi phát hiện 1 commit fix(<scope>). Acceptance: Lighthouse mobile ≥ 95 cả 4 mục; không lỗi WCAG 2.2 AA; build xanh.
```

### S18 — Go-live

**Intent**: Đổi `site` sang domain thật, kiểm tra sitemap/RSS/hreflang/OG, release `v1.0.0`.
**Tags**: review
**Chain rationale**: Thay đổi nhỏ → orchestrator sửa, `code-reviewer` + `seo-specialist` (direct) kiểm tra.

```text
[Plan: PLAN.md#phase-6] Orchestrator: nếu chưa có domain thì BLOCKED: HG-9. Sửa site trong astro.config.mjs (P6.1), build, rồi ecc:code-reviewer và ecc:seo-specialist kiểm tra sitemap-index.xml, rss.xml mọi locale, robots.txt, hreflang, canonical, OG trong dist (P6.2). Acceptance: mọi URL tuyệt đối trỏ domain mới; release PR tạo xong và chờ HG-3 để tag v1.0.0.
```

---

## 6. Direct helpers (ngoài catalogue của skill)

Catalogue của `plan-orchestrate` không có agent frontend, a11y hay SEO. Các agent dưới đây có trong môi trường và được gọi trực tiếp, không nằm trong chain:

| Agent | Dùng ở | Vai trò |
|---|---|---|
| `Explore` | S10 | Map code nhanh, read-only |
| `ecc:a11y-architect` | S10, S17 | WCAG 2.2 AA, RTL |
| `ecc:seo-specialist` | S5, S13, S18 | hreflang, sitemap, JSON-LD, canonical |
| `ecc:performance-optimizer` | S17 (khi Lighthouse < 95) | Bundle, font, ảnh, CLS |
| `general-purpose` | S10, S14–S16 | Agent duy nhất có công cụ Skill → dùng taste skills khi viết UI |

---

## 7. Bảng xung đột file & thứ tự merge

| Vùng file | Owner duy nhất theo wave | Ghi chú |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | W1: S2 · W2a: S3 · W3: S6–S8 · W4: S14 | Xung đột lockfile → lấy bản đích + `pnpm install` |
| `Header.astro`, `Base.astro`, `src/pages/**` | W2a: S4 · W2b: S5 · W5: S15a/b/c theo scope | S3 bị cấm đụng |
| `src/content.config.ts` + `public/admin/config.yml` | W2b: S5 (locales) · W3: S7 (zod), S9 (CMS) · W4: S13 | S9 và S7 cùng W3 nhưng khác dòng; merge S7 trước |
| `src/i18n/translations/*` | W2b: S5 · W5: S15a | Agent blog/pages chỉ đề xuất chuỗi |
| `src/styles/**` | W4: S14 | S15 chỉ đọc token |

Thứ tự merge vào `dev`: phase 1 → phase 2 → (phase 3, phase 4 — merge phase 3 trước) → phase 5 → phase 6.

---

## 8. Batch execution — dán lần lượt vào session chính

Mỗi dòng khởi chạy một wave; orchestrator tự spawn các track song song, merge, push và dừng ở cổng người.

```text
Chạy Wave 0 theo ORCHESTRATION.md (S0). Xong thì in các cổng người tôi có thể làm ngay (HG-0, HG-4, HG-5, HG-8).
Chạy Wave 1 theo ORCHESTRATION.md: S1 ∥ S2 dạng background agent với worktree riêng; merge vào phase/1-deploy, push, rồi dừng ở HG-1/HG-2. Đồng thời chạy Wave 2a (S3 ∥ S4) trên phase/2-cleanup.
Chạy Wave 2b theo ORCHESTRATION.md: merge S3, S4 rồi chạy S5; dừng ở HG-10; sau đó merge phase/2-cleanup vào dev và tạo release PR (HG-3).
Chạy Wave 3 theo ORCHESTRATION.md: track U (S6→S7→S8) ∥ track C (S9, chờ HG-4 nếu chưa có) ∥ track D (S10 rồi S11 ở session chính, chờ HG-5/HG-6).
Chạy Wave 4 theo ORCHESTRATION.md: S13 ∥ S12 ∥ S14 (S12, S14 chỉ sau HG-6).
Chạy Wave 5 theo ORCHESTRATION.md: S15a ∥ S15b ∥ S15c; merge theo thứ tự shell → blog → pages.
Chạy Wave 6 theo ORCHESTRATION.md: S17, và S16 cho các ảnh đã render; tạo release PR phase 5 (HG-3).
Chạy Wave 7 theo ORCHESTRATION.md: S18; dừng ở HG-9 nếu chưa có domain; release PR và chờ HG-3 để tag v1.0.0.
```
