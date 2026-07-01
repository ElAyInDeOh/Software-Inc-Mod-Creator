# Software Inc Mod Studio

[![GitHub release](https://img.shields.io/github/v/release/ElAyInDeOh/Software-Inc-Mod-Creator?include_prereleases&style=flat-square)](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?style=flat-square&logo=github)](https://elayindeoh.github.io/Software-Inc-Mod-Creator)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

A modern, browser-based mod creator for [**Software Inc.**](https://softwareinc.coredumping.com/).

Build mods with a live TyD preview, guided form editors, and optional AI assistance — all without touching a text editor.

---

## Two Ways to Use It

The same codebase serves both deployments. A runtime check (`js/runtime.js`) detects whether the page is loaded from `localhost` or `github.io` and automatically enables or hides AI features — no build step, no branching.

### ☁️ 1. GitHub Pages — Zero Setup

Runs entirely in your browser. No install, no server, no account.

🔗 **[Open the Live Tool](https://elayindeoh.github.io/Software-Inc-Mod-Creator)**

**Includes:** every editor, live preview, validation, presets, and the Level 3 scriptable feature editor.

**AI features are hidden on github.io** because the AI proxy runs in the bundled Node server (not in the browser). A "Download local for AI" banner points visitors to the local build.

---

### 💻 2. Local Deployment — Full Power (AI Enabled)

Run the same code through the bundled Node server to unlock AI assistance.

📦 **[Download Latest Release](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/releases/latest)**

**Requirements:**
- [Node.js](https://nodejs.org/) v16+

**Quick Start:**
```bash
# 1. Download and extract the release zip
# 2. In the folder:

npm install
npm start

# 3. Open http://localhost:8080
```

**Even easier:**
- **Windows:** Double-click `start.bat`
- **macOS/Linux:** Run `./start.sh`

**AI Setup (Optional):**
Click the chat bubble → Settings → choose your provider → paste your API key. BYOK (bring your own key) — your key never leaves your machine.

Supported: OpenAI, Anthropic Claude, Google Gemini, OpenRouter, Ollama, and any OpenAI-compatible endpoint.

---

## Project Files

Place downloaded `.tyd` files into your mod folder:

```
MyMod/
  meta.tyd
  SoftwareTypes/
    MySoftware.tyd
  CompanyTypes/
    MyCompany.tyd
  NameGenerators/
    mynames.txt
  Personalities/
    Personalities.tyd
  Thumbnail.png
```

The included `SoftwareIncFolderStructureAndExamples.zip` has a complete working example.

---

## Tech Stack

- Vanilla HTML/CSS/JS — no build step, no bundler
- Express server (`server.js`) for the AI proxy at `/api/ai/*` (local only)
- Single branch (`main`) serves both github.io and `npm start` via runtime gating

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the branching workflow, the AI gating pattern, and how to test both deployment modes locally.

Issues and PRs welcome! Check the [issue tracker](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/issues).

---

Not affiliated with Coredumping. Software Inc. is a trademark of Coredumping.
