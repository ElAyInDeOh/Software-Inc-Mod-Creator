# Software Inc Mod Studio

A modern, browser-based mod creator for [Software Inc.](https://softwareinc.coredumping.com/) with live preview, validation, and AI assistance.

![preview](https://img.shields.io/badge/version-2.0.0-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## What's Included

- **Software Type Editor** — Create software products with features, sub-features, categories, and hardware
- **Company Type Editor** — Define AI companies that develop and compete  
- **Name Generator** — Build tree-based name generators
- **Personalities Editor** — Create employee traits and relationships
- **Mod Metadata Editor** — Set mod name, description, and author
- **AI Assistant** — Generate content, get suggestions, and edit your mod via chat (BYOK — bring your own API key)

## Quick Start

### Requirements

- [Node.js](https://nodejs.org/) (v16 or later)

### Install & Run

```bash
# 1. Extract the zip
# 2. Open a terminal in the extracted folder

# Install dependencies
npm install

# Start the server
npm start
```

Then open **`http://localhost:8080`** in your browser.

That's it.

### Windows (Double-Click)

If you don't want to use the terminal, just run **`start.bat`** after installing Node.js.

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

## AI Setup (Optional)

The tool works perfectly without AI. To enable it:

1. Click the **floating chat bubble** (bottom-right)
2. Click **Settings** → choose your provider
3. Enter your API key — it stays in your browser, never sent to us
4. Click **Save & Test**

**Supported providers:** OpenAI, Anthropic Claude, Google Gemini, OpenRouter, Ollama, and any OpenAI-compatible endpoint (LM Studio, LocalAI, etc.)

## Project Files

Place downloaded `.tyd` files into your mod folder following this structure:

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

See `SoftwareIncFolderStructureAndExamples.zip` for a complete working example.

## Updating

To update to a newer release, just download the new release and overwrite your existing folder (or keep them side by side).

## More Info

- [Official Modding Wiki](https://softwareinc.coredumping.com/wiki/index.php/Modding)
- [Report Issues](https://github.com/elayindeoh/Software-Inc-Mod-Creator/issues)

---

Not affiliated with Coredumping. Software Inc. is a trademark of Coredumping.
