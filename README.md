# Software Inc Mod Studio

[![GitHub release](https://img.shields.io/github/v/release/ElAyInDeOh/Software-Inc-Mod-Creator?include_prereleases&style=flat-square)](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?style=flat-square&logo=github)](https://elayindeoh.github.io/Software-Inc-Mod-Creator)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

A modern, browser-based mod creator for [**Software Inc.**](https://softwareinc.coredumping.com/).

Build mods with a live TyD preview, guided form editors, and optional AI assistance — all without touching a text editor.

---

## Two Ways to Use It

### ☁️ 1. GitHub Pages (Classic) — Zero Setup

The original static tool that runs entirely in your browser. No install, no server, no account.

🔗 **[Open the Live Tool](https://elayindeoh.github.io/Software-Inc-Mod-Creator)**

**Includes:**
- Software Type Editor (basic)
- Company Type Editor
- Name Generator
- Classic form-based layout

**Limitation:** Browser security blocks AI API calls from `github.io`, so this version has **no AI features**.

---

### 💻 2. Local Deployment (Recommended) — Full Power

The redesigned studio with AI chat, live preview on every editor, and a modern split-pane interface.

📦 **[Download Latest Release](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/releases/latest)**

**What you get:**
- **Software Type Editor** — SpecFeatures, SubFeatures, categories, hardware
- **Company Type Editor** — AI companies with spawn rates and software focus
- **Name Generator** — Simple + advanced tree-based modes
- **Personalities Editor** — Employee traits with relationships & incompatibilities
- **Mod Metadata Editor** — `meta.tyd` for your mod's name, description, author
- **Floating AI Assistant** — Generate content, get suggestions, apply changes directly to forms (BYOK)
- **Live TyD Preview** — See the output update as you type
- **Validation** — Catch errors before you download

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
Click the chat bubble → Settings → choose your provider → paste your API key.

Supported: OpenAI, Anthropic Claude, Google Gemini, OpenRouter, Ollama, and any OpenAI-compatible endpoint.

---

## Releases

| Release | Branch | Description |
|---------|--------|-------------|
| [v2.0.0 (Latest)](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/releases/tag/v2.0.0) | `local-deploy` | Modern redesign, AI chat on every editor, easy start scripts |
| [Original (Classic)](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/releases) | `main` | Static form editors, GitHub Pages compatible |

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
- Express server for AI proxy (local version only)
- AI calls go directly from your browser to your chosen provider

---

## Contributing

Issues and PRs welcome! Check the [issue tracker](https://github.com/ElAyInDeOh/Software-Inc-Mod-Creator/issues).

---

Not affiliated with Coredumping. Software Inc. is a trademark of Coredumping.
