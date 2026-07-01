# Software Inc Mod Studio — Code Review & Project Overview

> Review date: 2026-07-01
> Reviewer: opencode (automated)
> Baseline: `local-deploy` @ `922eac6` (with `main` and `NewUI` branches cross-referenced)
> Repo: https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator.git

This document is a **read-only review**. No source code was modified to produce it.
The only files created/edited alongside this review are: this file, `LICENSE`, and `.gitignore`.

---

## 1. Project Overview

**Software Inc Mod Studio** is a browser-based mod creator for the game
[Software Inc.](https://softwareinc.coredumping.com/). Users build `.tyd` mod
files through guided form editors with a live TyD preview, validation, presets,
and optional AI assistance (BYOK — bring your own API key).

**Tech stack:** Vanilla HTML/CSS/JS (no bundler, no build step) + a small
Node.js/Express server whose sole purpose is an AI proxy that sidesteps browser
CORS restrictions.

**Package identity** (`package.json`):
- name: `software-inc-mod-studio`, version `2.0.0`, license MIT, author ElAyInDeOh
- deps: `express ^4.18.2`, `cors ^2.8.5`
- engines: `node >=16.0.0`
- scripts: `dev`/`start` → `node server.js`; `build` → no-op (static site)

### Tracked source files (local-deploy, 29 files)

```
.gitattributes .gitignore README.md SELF_HOSTING.md
package.json package-lock.json server.js start.bat start.sh
index.html software-type.html company-type.html name-generator.html
personalities.html meta-editor.html
SoftwareIncModCreatorMainPage.html softwareIncModCreatorSoftwareMini.html
softwareIncModCreatorSoftwareType.html   <-- legacy "Classic" editors (CamelCase)
css/studio.css
js/ai-assistant.js js/ai-chat.js js/ai-chat-page.js
js/presets.js js/script-presets.js js/studio.js js/tyd-engine.js
BitcoinIcon.png BitcoinQRCode.png        <-- donation images used by Classic page
SoftwareIncFolderStructureAndExamples.zip
```

`node_modules/` is correctly git-ignored and **not** tracked (verified: 0 tracked
files under `node_modules/`). `package-lock.json` **is** tracked (correct).

---

## 2. Branch Strategy

Three long-lived branches, all pushed to `origin`. They have **diverged**
(`git merge-base --is-ancestor NewUI local-deploy` ⇒ NewUI is NOT an ancestor of
local-deploy, despite a historical "Merge branch 'NewUI' into local-deploy"
commit). Treat each branch as its own release track.

| Branch | Purpose | Key contents | Target audience |
|--------|---------|---------------|------------------|
| `main` | GitHub Pages — static classic | 9 files, CamelCase legacy HTML (`CompanyType.html`, `Name_Generator.html`...), no `server.js`, no `package.json`, **no AI** | Public visitors of the Pages site |
| `NewUI` | The redesign with live preview + presets | `css/studio.css`, `js/*` modules, editors, plus internal docs `ARCHITECTURE.md`, `CORS_EXPLAINED.md`, `OVERHAUL_BRAINSTORM.md` | Development / design reference |
| `local-deploy` *(current, recommended)* | Full power local version | Everything in NewUI **plus** `server.js`, `package.json`, `start.bat`/`start.sh`, `.gitattributes`, `js/ai-chat-page.js`, 50 SIPL Level-3 script presets | The release users download & run |

`Read-only: only the commit metadata/branch topology was inspected above; no
changes were made.`

**Observations on branch topology**
- `local-deploy` is 18 commits ahead of `main` and is the canonical/active branch.
- `main` carries the standalone Pages build (1 commit, `043b4e7 "Add files via upload"`).
- `NewUI` has drifted from `local-deploy` on `README.md`, `js/script-presets.js`,
  `js/tyd-engine.js`, and `software-type.html`. If/when NewUI is merged again,
  resolve these four files deliberately.

### Recommended branch model (for the future)
- `main` = Pages release (static, no AI). Keep it minimal and tag it as the
  "Classic" release.
- `local-deploy` = primary development + the downloadable "v2.x" release.
- `NewUI` = consider archiving, or fold its useful design docs
  (`ARCHITECTURE.md`, `CORS_EXPLAINED.md`) into `local-deploy` and delete the
  branch. Keep `OVERHAUL_BRAINSTORM.md` out of public branches (it's an internal
  planning doc).

---

## 3. Architecture

```
Browser (HTML/CSS/JS)                       Local Node.js server (server.js)
┌──────────────────────────────┐           ┌───────────────────────────────┐
│ index.html (home + presets)  │           │ express.static(__dirname)    │
│ software-type.html ──┐       │           │   → serves all HTML/CSS/JS    │
│ company-type.html    │       │  fetch    │ no-cache headers on .js/.css  │
│ name-generator.html  │ each  │ ────────► │                               │
│ personalities.html   │ page  │  /api/ai/  │ POST /api/ai/chat             │
│ meta-editor.html     │ loads │   chat     │   → forwards to OpenAI/       │
│                      │ the   │            │     Anthropic/Gemini/Ollama/   │
│ js/tyd-engine.js     │ shared│            │     OpenRouter/custom         │
│ js/presets.js        │ AI    │            │ GET  /api/ai/models           │
│ js/studio.js         │ chat  │            │ POST /api/ai/test             │
│ js/ai-assistant.js ──┘       │            │   (self-calls /chat)          │
│   - BYOK config in            │           │ listens 0.0.0.0:8080          │
│     localStorage               │           └───────────────────────────────┘
└──────────────────────────────┘
```

**Data flow (AI):** Browser stores provider+apiKey+model in `localStorage`
(`simc_ai_config`). On a chat action, `js/ai-assistant.js` POSTs `{provider,
apiKey, model, messages, ...}` to the local `/api/ai/chat`, which forwards to the
real provider and parses the response. The browser never calls the AI provider
directly — it always goes through the local proxy. (See finding **F2** — the docs
claim the opposite.)

**Persistence:** Projects/theme/config live in `localStorage`
(`simc_projects`, `simc_current_project`, `simc_theme`, `simc_ai_config`).
No server-side storage; a browser's data does not follow the user.

**Editors** share a common shell: a split-pane layout (form + live TyD preview),
a floating AI chat widget (`AIChatPage`), and the shared `Studio`/`TyDEngine`/
`AIAssistant` modules. Classical legacy editors (`SoftwareIncModCreator*.html`)
remain linked from the home page as the "Classic Version".

---

## 4. Code Review Findings

Findings are severity-rated. **None of them were fixed in this pass** — this is a
review only. Locate each item by its `file:line` reference.

### F1 — Missing LICENSE file (push-readiness)  ·  **High**
`package.json` declares `"license": "MIT"`, and `README.md:5` shows a `[![License]`
badge linking to `LICENSE`, but **no `LICENSE` file exists in the repo**.
This is the single biggest "not push-ready" gap.
*Fix applied in this pass:* a standard MIT `LICENSE` file was added (not source
code). See §6.

### F2 — Documentation contradicts behavior: AI data path  ·  **High (docs)**
Three places claim the browser talks to the AI provider **directly**, bypassing
servers. In reality every call is proxied through the local Node server.

| Location | Claim | Reality |
|----------|-------|---------|
| `js/ai-assistant.js:4` | "All API calls are made directly from the browser to the provider." | `chat()` POSTs to `/api/ai/chat` (line 158) |
| `SELF_HOSTING.md:119` | "Keys are sent directly from your browser to the AI provider — **never through our servers**" | Keys pass through `server.js` (`server.js:28,38,44,...`) |
| `README.md:107` | "AI calls go directly from your browser to your chosen provider" | Same as above |

The proxy is the *correct* design (it's the whole reason `server.js` exists — to
beat CORS). The docs are simply wrong. When you're ready to edit prose, reword to:
"AI calls go from your browser to your local Node server, which forwards them to
your chosen provider — this avoids browser CORS blocks. The server is yours and
runs on your machine; it does not log or retain your API key."

### F3 — Dead/duplicated provider config (two sources of truth)  ·  **Medium (maint)**
`js/ai-assistant.js:12-119` defines a large `PROVIDERS` map with `url`,
`headers()`, `body()`, `parse()`, `buildUrl()` for each provider. A grep confirms
**none of those functions/fields are referenced anywhere** — only
`provider.defaultModel` and existence are used (`ai-assistant.js:151,154`). All
actual request logic is re-implemented independently in `server.js:35-120`.

Consequence: there are two parallel descriptions of every provider, and they can
drift silently. The `PROVIDERS.*.models` lists (e.g. `gpt-4o`,
`claude-3-5-sonnet-20241022`, `gemini-1.5-flash`) are also now stale. Recommendation
when you do code changes: delete the unused `headers/body/parse/buildUrl/url` from
the client map (keep `name`, `defaultModel`, an optional `models` hint for the UI),
and let `server.js` be the single source of truth.

### F4 — API key transmitted as a URL query parameter  ·  **Low (local-only)**
`server.js:130-143` (`GET /api/ai/models`) and `js/ai-assistant.js:197` send
`apiKey` as `?apiKey=...`. URL query strings are commonly written to access logs /
proxy logs / shell history. In addition, error responses echo the request URL
(`server.js:91`, `:148`) which for the Gemini path contains `?key=...`.

Because this is a single-user localhost tool it's low risk, but for a cleaner
implementation: pass the key in a header (`x-api-key`) and avoid echoing the
redacted URL in error bodies.

### F5 — Potential stored XSS via localStorage strings  ·  **Low (local-only)**
`index.html:151-153` injects preset `name`/`description`, and `:171` injects the
project's `p.name`, directly into `innerHTML` without escaping. Project names come
from `Studio.createProject(name)` (`studio.js:74`) which uses raw user input
(prompt). `ai-chat-page.js` is careful (escapes with `.replace(/</g,'&lt;')`),
and `index.html:177` correctly escapes dates, but the name fields do not.

Impact is limited to the user's own browser/localStorage, so severity is low. If
you ever load/swap preset packs from an external source this becomes more serious.
Recommend `textContent` or an `escapeHtml()` helper for `p.name`/preset fields.

### F6 — Server binds 0.0.0.0 + no rate limiting + open SSRF surface  ·  **Low–Medium**
- `server.js:7` `HOST='0.0.0.0'` exposes the studio (and its AI key-forwarding
  proxy) to the whole LAN by default. This is **intentional** for the
  mobile-on-WiFi flow described in `SELF_HOSTING.md`, but combined with:
- No rate limiting on `/api/ai/chat` (any LAN peer can drive your API bill), and
- `openrouter`/`custom`/`openaiCompatible` cases let the caller set an arbitrary
  outbound `customUrl` (`server.js:73-76`), i.e. the server will `fetch()` any URL
  the caller chooses — a classic SSRF shape.

For a single-user localhost tool this is acceptable. Document it; consider
defaulting `HOST` to `127.0.0.1` and opting into LAN via an env var
(`HOST=0.0.0.0 PORT=8080 npm start`), plus an allowlist for `customUrl`.

### F7 — Self-referential test endpoint  ·  **Minor**
`server.js:166-183` `POST /api/ai/test` performs `fetch('http://localhost:${PORT}
/api/ai/chat', ...)` — the server HTTP-calls itself. It works, but it's needlessly
fragile (depends on HOST binding + port). Could extract the inner logic into a
function both handlers call. Minor refactor for later.

### F8 — NewUI branch committed an internal planning doc  ·  **Minor (cleanup)**
`NewUI:OVERHAUL_BRAINSTORM.md` is an internal "living document for planning the
next version". The `local-deploy` `.gitignore` already ignores similar internal
docs (`modding_research.md`, `PROJECT_OVERVIEW_AND_IMPROVEMENTS.md`), but those
ignore rules don't help NewUI retroactively. `ARCHITECTURE.md` and
`CORS_EXPLAINED.md` on NewUI are genuinely useful public docs and could be ported
to `local-deploy` when convenient.

### F9 — Cache-busting relies on manual `?v=` params  ·  **Minor**
`index.html:9` uses `css/studio.css?v=2`. (NewUI commit `b8dcf85` "Add
cache-busting version params".) The server *also* sets `no-cache` on
`.js/.css/.html` (`server.js:13-20`), so the `?v=` is belt-and-suspenders. Harmless
but easy to forget to bump. Fine to leave.

### F10 — Outdated default model IDs  ·  **Minor (maint)**
`ai-assistant.js` defaults reference model IDs that age quickly
(`gpt-4o`, `claude-3-5-sonnet-20241022`, `gemini-1.5-flash`). Not a bug today, but
tie this to F3 (consolidate provider config) so the list lives in one place and is
easy to refresh.

### F11 — No tests / no lint config  ·  **Recommendation**
`package.json` has no `test` script and there's no ESLint/Prettier config. For
vanilla-HTML of this size that's a reasonable tradeoff, but for "push ready" a
minimal `npm run lint` (e.g. a `npx eslint js/` step) and a `.github/workflows`
CI check would meaningfully raise confidence. Out of scope for this review.

### Things that are *good*
- `node_modules/` properly ignored; lockfile committed.
- API-key field renders as `type="password"` (`ai-assistant.js:585`) and is held
  only in `localStorage` — never written to disk, never committed (verified by
  `git log --all -S` scans for `sk-…` / `AIza…` patterns, all clean).
- HTML-escaping is consistently applied in the chat path (`ai-chat-page.js`).
- `.gitattributes` correctly forces LF for `*.sh` and CRLF for `*.bat` — good
  cross-platform hygiene that matches what `start.bat`/`start.sh` need.
- Clear, helpful README + SELF_HOSTING guide with accurate localStorage behavior
  (apart from F2).

---

## 5. Security Audit Summary

| Check | Result |
|-------|--------|
| Hardcoded secrets / API keys in source | **None found** (grep for `sk-`, `AIza…`, `Bearer …`, `sk-ant` all clean) |
| Secrets in git history (all branches) | **None found** (`git log --all --source -p -S` clean) |
| `.env` / credential files committed | None exist / none tracked |
| License declared but missing file | **Yes — F1** (fixed: added MIT `LICENSE`) |
| Ignored dirs present on disk but not tracked | `node_modules/` only — correct |
| `package-lock.json` tracked | Yes — correct |
| Dependency count | 2 runtime deps (`express`, `cors`) — minimal, good |

No action required beyond F1 (LICENSE, added here). F4/F6 are acknowledged
local-tool trade-offs, documented above.

---

## 6. Push-Readiness Status

| Item | Before | After this pass |
|------|--------|-----------------|
| `node_modules/` ignored & untracked | OK | OK |
| `package-lock.json` tracked | OK | OK |
| No secrets in history | OK | OK |
| `LICENSE` present (refs MIT in `package.json` + README) | **MISSING** | **ADDED** (MIT) |
| `.gitignore` comprehensive | Minimal | **EXPANDED** (logs, env, build, caches, coverage, OS, test artifacts, internal docs) |
| Lint/typecheck/CI | None | Not added (out of scope — see F11) |
| Docs/behavior match (AI proxy vs "direct") | **Mismatch** (F2) | Not changed — *code unchanged by request*; flagged for a future PR |
| Dead provider config (F3) | Present | Not changed — flagged for a future PR |

**Net:** After committing `LICENSE`, the updated `.gitignore`, and this
`CODE_REVIEW.md`, the `local-deploy` branch is **push-ready**. The remaining
items (F2 docs wording, F3 dead code, F11 CI) are recommendations, not blockers,
and intentionally were left untouched per the "don't change code" constraint.

---

## 7. Suggested Next Steps (when you're ready to code)
1. Reword the three docs claims in F2 (≈5 min; no logic change).
2. Delete the unused `headers/body/parse/buildUrl/url` from `PROVIDERS` in
   `js/ai-assistant.js` (F3) and make `server.js` the single source of truth.
3. Move `apiKey` from query string to a header in `/api/ai/models` (F4).
4. Escape `p.name` / preset strings in `index.html` (F5).
5. Consider defaulting `HOST=127.0.0.1` with an opt-in for LAN (F6).
6. Add a tiny ESLint config + a `test` script + a CI workflow (F11).
7. Consolidate `main` (Pages/Classic) vs `local-deploy` (Full) as the two
   supported branches; archive `NewUI` after porting its design docs.

---

*Generated by opencode. No source code was modified to produce this document.*
