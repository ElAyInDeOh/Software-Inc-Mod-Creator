# Contributing to Software Inc Mod Studio

Thanks for working on this project. This document covers everything you need to know: the branching workflow, the runtime gate that lets one codebase serve both GitHub Pages (no AI) and the local build (AI enabled), how to test both modes, and the exact patterns to follow when adding new code.

---

## Repository layout

One branch, one codebase. This is the most important thing to internalize.

```
main  ←  the only branch
 └─ pushed to GitHub
     ├─ GitHub Pages auto-deploys it → elayindeoh.github.io (web-only, AI hidden)
     └─ Local users run `npm start` against the same commit → localhost:8080 (AI enabled)
```

There is no `NewUI` branch. There is no `local-deploy` branch. Anyone who clones the repo and runs `npm start` gets the AI-enabled build; anyone visiting the live site gets the web-only build — automatically, from the same code.

**Why this works:** `js/runtime.js` is loaded synchronously in every page's `<head>`, before any other script. It inspects `location.hostname`:

- `localhost`, `127.0.0.1`, `::1`, `0.0.0.0`, `*.local` → `window.LOCAL_BUILD = true` → `<html class="local-build ai-enabled">`
- anything else (e.g. `elayindeoh.github.io`, `file://`) → `window.LOCAL_BUILD = false` → `<html class="web-only">`

CSS rules then hide or show AI UI. The three `js/ai-*.js` modules early-return no-op stubs when `!window.LOCAL_BUILD`. Non-AI code runs identically in both modes.

---

## Branching workflow (Option 3 — feature branch, local merge)

### Default: work on `main` directly

For small fixes — typos, CSS tweaks, bug fixes, copy changes, anything that won't break the live site if it ships immediately:

```bash
git checkout main
git pull
# edit files
git commit -m "Fix validation message on company-type editor"
git push
```

GitHub Pages rebuilds in ~30s. Done.

### For anything non-trivial: use a feature branch

Use a branch when the work is experimental, touches AI gating, changes editor logic, adds a new page, or is big enough that you don't want half-finished code on the live site.

```bash
# 1. Start from up-to-date main
git checkout main
git pull

# 2. Create a feature branch
git checkout -b feature/my-new-thing

# 3. Work, commit as many times as you like
git commit -m "WIP: scaffold new thing"
git commit -m "Wire up the new thing"
git commit -m "Add tests + manual verification notes"

# 4. Keep main's changes if it moved while you worked
git fetch origin
git rebase origin/main   # or: git merge origin/main

# 5. When ready, merge locally (no PR needed)
git checkout main
git pull
git merge --no-ff feature/my-new-thing
git push

# 6. Delete the feature branch
git branch -d feature/my-new-thing
```

### When to use a pull request instead

Plain local merge (above) is the default. Use a PR when:
- You want the diff-review page on GitHub before merging
- An outside contributor is involved
- You want the merge recorded as a PR (for discussion / future reference)

PRs are welcome via the standard GitHub flow — push the branch, open a PR, merge via the UI.

### Branch naming

- `feature/…` — new functionality
- `fix/…` — bug fixes
- `docs/…` — documentation only
- `refactor/…` — internal cleanup, no behavior change

### Discarding work

A branch you no longer want:

```bash
git checkout main
git branch -D feature/abandoned-idea    # -D forces deletion even if unmerged
```

This is the main advantage of feature branches over committing to `main`: discarding is zero-trace.

---

## Local development setup

```bash
git clone https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator.git
cd Software-Inc-Mod-Creator
npm install
npm start
```

Server runs on **http://localhost:8080** (port defined in `server.js:6` as `process.env.PORT || 8080`). Override with `PORT=3000 npm start` if needed.

There is **no build step**. Edits to HTML/CSS/JS are live on browser refresh. `package.json`'s `build` script is a no-op echo confirming this.

---

## Testing both deployment modes

Because the AI gate is host-based, you can test both modes **from the same running server** — no need to deploy to verify web behavior.

### Local mode (AI on) — the default

```
http://localhost:8080/index.html
http://localhost:8080/company-type.html
```

`<html class="local-build ai-enabled">` → AI chat FAB visible, "AI Generate" buttons visible, AI settings modal available, "Download local" banner hidden.

### Web-only mode (AI off) — force it with `?ai=0`

```
http://localhost:8080/index.html?ai=0
http://localhost:8080/company-type.html?ai=0
```

`<html class="web-only">` → identical to what a github.io visitor sees. AI chat FAB hidden, "AI Generate" buttons hidden, AI settings modal hidden, "Download local for AI" banner visible. Calling any AI function returns a rejected Promise.

### Force AI on if your host is non-loopback

```
http://your-lan-host:8080/?ai=1
```

Useful when testing from another device on your network where `location.hostname` isn't `localhost`.

### What to verify before every push that touches AI code

1. Load `index.html` (no `?ai=` param) — banner hidden, page renders normally.
2. Load `index.html?ai=0` — banner visible, no AI UI anywhere.
3. Load `company-type.html?ai=0` — `.chat-fab`, `.btn-ai`, `#ai-settings-modal` all `display: none`.
4. Load `company-type.html` (no param) — `.chat-fab` visible, opening settings works.
5. If you added new AI surface, confirm it's hidden under `?ai=0` (see the gating pattern below).

---

## The AI gating pattern

This is the core rule. When you add new AI functionality, it must be hidden on the web build. The mechanism depends on what you're adding:

### 1. New HTML element (button, modal, FAB, section)

Give it one of the existing gated classes, OR add its selector to the gating rule in `css/studio.css:785`:

```css
html:not(.ai-enabled) .chat-fab,
html:not(.ai-enabled) .chat-window,
html:not(.ai-enabled) #ai-settings-modal,
html:not(.ai-enabled) .btn-ai,
html:not(.ai-enabled) .your-new-class {        /* ← add new AI elements here */
  display: none !important;
}
```

Or inline-class it as `btn-ai` if it's a button-style AI action — that class is already gated.

### 2. New "Download local for AI" promo banner

Tag the element with `data-web-only` (no class needed):

```html
<section data-web-only>
  <p>Want AI? Run this project locally…</p>
</section>
```

The reverse rule hides it locally:

```css
html.ai-enabled [data-web-only] {
  display: none !important;
}
```

### 3. New JS function inside an existing AI module

No work needed. `js/ai-assistant.js`, `js/ai-chat.js`, and `js/ai-chat-page.js` all have this guard at the top of their IIFE:

```js
if (typeof window !== 'undefined' && !window.LOCAL_BUILD) {
  return { /* no-op stubs for every public method */ };
}
```

Any new method you add to a module's public `return {…}` block is automatically stubbed on the web build — but you must also add a no-op entry of the same name to the stub object at the top of the file. Example, adding `generateFoo` to `ai-assistant.js`:

```js
// At the top of the file, in the early-return stub block:
if (!window.LOCAL_BUILD) {
  return {
    // …existing stubs…
    generateFoo: function () { return Promise.reject(new Error('AI features require the local build.')); },
    // …
  };
}

// Down in the real implementation:
function generateFoo() {
  // …real code…
}
return {
  // …existing exports…
  generateFoo
};
```

If you forget the stub, calling `AIAssistant.generateFoo()` on github.io throws "is not a function" instead of the clean "download local" message. Not catastrophic, but ugly.

### 4. New AI module file entirely

Wrap its IIFE with the same guard. Example, a new `js/ai-translator.js`:

```js
const AITranslator = (function () {
  'use strict';

  if (typeof window !== 'undefined' && !window.LOCAL_BUILD) {
    return {
      translate: function () { return Promise.reject(new Error('AI features require the local build.')); },
      isConfigured: function () { return false; }
    };
  }

  // …real implementation…
  return { translate, isConfigured };
})();

if (typeof window !== 'undefined') {
  window.AITranslator = AITranslator;
}
```

You also must add `<script src="js/runtime.js?v=1"></script>` before this module's `<script>` tag on any HTML page that uses it — `runtime.js` must run first to set `window.LOCAL_BUILD`.

### 5. New HTML page that uses AI

Add both lines to `<head>`, in this order, before `</head>`:

```html
<link rel="stylesheet" href="css/studio.css?v=2">
<script src="js/runtime.js?v=1"></script>
```

And then, at the end of `<body>`, after `js/studio.js`:

```html
<script src="js/ai-assistant.js?v=6"></script>
<script src="js/ai-chat.js?v=6"></script>
<script src="js/ai-chat-page.js?v=6"></script>
```

Bump the `?v=` query param on any file you edit, to bust the browser cache for github.io visitors.

---

## Key files reference

| Path | Role |
|------|------|
| `js/runtime.js` | Host detection; sets `window.LOCAL_BUILD` and tags `<html>`. Loaded first in every `<head>`. |
| `css/studio.css` | Stylesheet; gating rules at the end (lines ~780-793). All AI UI visibility lives here. |
| `js/ai-assistant.js` | BYOK LLM provider integration (OpenAI, Anthropic, Gemini, Ollama, etc.). Calls go to `/api/ai/*` on the local server. |
| `js/ai-chat.js` | Chat system: message handling, AI response parsing, operation execution. |
| `js/ai-chat-page.js` | Floating chat widget UI logic shared across all editor pages. Initialized per-page via `AIChatPage.init({...})`. |
| `server.js` | Express server. Serves static files AND the AI proxy at `/api/ai/chat`, `/api/ai/models`, `/api/ai/test`. Port 8080 by default. |
| `index.html` | Home page. Lists tools, presets, recent projects. Has the `data-web-only` "Download local" banner. |
| `company-type.html`, `software-type.html`, `personalities.html`, `name-generator.html`, `meta-editor.html` | The five editor pages. All have the same AI integration block at the end: script tags + an `AIChatPage.init({…})` call with page-specific system prompt + operation callbacks. |

---

## Git conventions

### Commit messages

Short imperative summary on the first line (≤72 chars). Optional body explaining why, not what.

```
Add runtime build-variant gate for web vs local AI features

js/runtime.js (loaded in <head>) detects localhost vs github.io and
tags <html> with class 'ai-enabled' or 'web-only'...
```

### Push policy

- `git push` to `main` is fine for small fixes (Option 3 default flow).
- **Never force-push to `main`** — github.io reads from it. If you must rewrite history on `main`, coordinate first. `git push --force-with-lease` is always safer than `--force`.
- Force-pushing to feature branches is fine (they're yours).

### Keeping main stable

If you push something broken to `main` and github.io goes sideways:

```bash
git revert <bad-commit-sha>
git push
```

The site rebuilds within ~30s. Don't panic, don't force-push — `git revert` keeps the history honest and is always safe.

---

## AI feature notes

- The AI proxy lives in `server.js` at `/api/ai/*`. It exists so browser-side AI calls avoid CORS issues — the browser calls the local Node server, which calls the provider (OpenAI, Anthropic, etc.) server-side.
- This is why AI only works on `localhost`: there's no proxy on github.io, so the runtime gate hides the UI and stubs the calls before they're ever made.
- API keys are stored in `localStorage` under `simc_ai_config`. They never leave the user's machine. The README calls this BYOK (bring your own key).
- Supported providers are listed in `js/ai-assistant.js`'s `PROVIDERS` object. To add a new provider, add an entry there and wire up its `url`, `headers`, `body`, and `parse` functions.

---

## Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Run locally (AI on) | `npm start` → http://localhost:8080 |
| Test web mode | append `?ai=0` to any URL |
| Test AI mode from non-loopback host | append `?ai=1` |
| Start a feature | `git checkout -b feature/xyz` |
| Merge feature locally | `git checkout main && git merge --no-ff feature/xyz` |
| Discard a feature | `git branch -D feature/xyz` |
| Revert a bad push | `git revert <sha> && git push` |
| Deploy to live site | `git push origin main` (Pages auto-builds) |

---

Questions or stuck? Open an issue at https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/issues.
