# Software Inc Mod Studio — Architecture & Design Document

> **For:** Software Inc Mod Creator overhaul  
> **Constraints:** GitHub Pages (static only), BYOK LLM optional, no backend  
> **Goal:** Intuitive, beautiful, powerful mod creation with optional AI assistance

---

## 1. Philosophy

**"A mod studio in your browser."**

The tool evolves from "fill out a form, download a file" to a **project-based mod studio** where you:
1. Create a **Mod Project**
2. Add/edit **SoftwareTypes**, **CompanyTypes**, **NameGenerators**, **Personalities**
3. See a **live TyD preview** as you type
4. Optionally use **your own LLM** to generate content quickly
5. **Export everything** as a ready-to-use `.zip`

**Without an LLM connected**, it's still a best-in-class form editor with presets, validation, and live preview.  
**With an LLM connected**, it becomes a creative accelerator — describe what you want, AI fills in the details.

---

## 2. Tech Stack (GitHub Pages Compatible)

| Layer | Choice | Why |
|-------|--------|-----|
| **Styling** | Tailwind CSS v3 (CDN) | Modern utility classes, dark mode support, no build step |
| **Reactivity** | Alpine.js v3 (CDN) | 15KB, zero build, perfect for dynamic forms |
| **Icons** | Lucide (CDN) | Clean, consistent icon set |
| **Code Preview** | PrismJS (CDN) | Syntax highlighting for TyD |
| **Zip Export** | JSZip + FileSaver (CDN) | Generate `.zip` in browser |
| **LLM APIs** | Native `fetch()` | Direct browser calls to OpenAI, Anthropic, Google, Ollama |
| **Storage** | localStorage | Save projects, API keys, preferences |

**No build step. No bundler. No npm.** Just HTML + CDN libraries + our JS.

---

## 3. File Structure

```
/
├── index.html                          # NEW: Project Dashboard / Landing
├── software-type.html                  # NEW: Unified SoftwareType editor
├── company-type.html                   # UPDATED: Enhanced CompanyType editor
├── name-generator.html                 # UPDATED: Enhanced Name Generator
├── personalities.html                  # NEW: Personality editor
├── meta-editor.html                    # NEW: Mod metadata editor
├── css/
│   └── studio.css                      # Custom styles beyond Tailwind
├── js/
│   ├── studio.js                       # Shared UI, nav, dark mode, storage
│   ├── tyd-engine.js                   # TyD serializer + validator
│   ├── presets.js                      # Balanced preset data
│   ├── ai-assistant.js                 # BYOK LLM integration
│   └── software-type-editor.js         # SoftwareType-specific logic
├── (legacy files preserved)
│   ├── SoftwareIncModCreatorMainPage.html   # Add banner linking to new
│   ├── softwareIncModCreatorSoftwareType.html
│   ├── softwareIncModCreatorSoftwareMini.html
│   ├── CompanyType.html
│   ├── Name_Generator.html
│   └── ...
└── assets/
    └── logo.svg
```

**Migration strategy:** New files coexist with old. Old pages get a subtle banner: "Try the new Mod Studio →". Once stable, old pages redirect.

---

## 4. UI Design System

### 4.1 Color Palette

```css
/* Light Mode */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-card: #ffffff;
--text-primary: #0f172a;
--text-secondary: #64748b;
--border: #e2e8f0;
--accent: #3b82f6;       /* Blue - primary action */
--accent-hover: #2563eb;
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;

/* Dark Mode */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-card: #1e293b;
--text-primary: #f1f5f9;
--text-secondary: #94a3b8;
--border: #334155;
--accent: #60a5fa;
--accent-hover: #3b82f6;
```

### 4.2 Layout Patterns

**Dashboard:**
```
┌────────────────────────────────────────────────────────┐
│  🎮 Software Inc Mod Studio              [🌙] [⚙️]    │
├────────────────────────────────────────────────────────┤
│  Start New Project                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │ 🎮 Game    │ │ 🖥️ OS      │ │ 🎨 Tool    │ ...     │
│  └────────────┘ └────────────┘ └────────────┘         │
│                                                        │
│  Recent Projects                    [AI: Disconnected] │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📁 MyRPGMod                [Edit] [Export] [🗑️] │  │
│  │    SoftwareTypes: 1  CompanyTypes: 1            │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Editor (Split Pane):**
```
┌──────────────────────────────┬─────────────────────────┐
│  ← Back to Dashboard         │  💾 Save  📋 Copy  ⬇️   │
├──────────────────────────────┼─────────────────────────┤
│                              │                         │
│  FORM FIELDS                 │  LIVE PREVIEW           │
│  (Alpine.js reactive)        │  (PrismJS highlighted)  │
│                              │                         │
│  ┌─ Basic Info ─────────┐   │  SoftwareType           │
│  │ Name: [________]     │   │  {                      │
│  │ ...                  │   │    Name    "My Game"    │
│  └──────────────────────┘   │    ...                  │
│                              │  }                      │
│  ┌─ Features ───────────┐   │                         │
│  │ [+ Add SpecFeature]  │   │  [Validate] [Download]  │
│  │ ┌─ Graphics ───────┐ │   │                         │
│  │ │ Spec: 3D         │ │   │  ⚠️ Warning: No         │
│  │ │ [+ Add Sub]      │ │   │  CompanyType defined    │
│  │ └──────────────────┘ │   │  for this software.     │
│  └──────────────────────┘   │                         │
│                              │                         │
│  [🤖 Ask AI to generate    │                         │
│   a feature]                 │                         │
│                              │                         │
└──────────────────────────────┴─────────────────────────┘
```

### 4.3 Component Patterns

- **Cards:** White/dark rounded-xl with shadow-sm, hover:shadow-md transition
- **Inputs:** Rounded-lg, focus:ring-2 focus:ring-accent, clear labels with ⓘ tooltip
- **Buttons:**
  - Primary: filled accent
  - Secondary: outlined
  - Danger: red
  - Ghost: text only
- **Accordions:** Chevron-rotate animation, smooth height transition
- **AI Button:** Purple gradient (`from-violet-500 to-fuchsia-500`), sparkle icon

---

## 5. Data Model

### 5.1 Project Structure

```javascript
const Project = {
  id: "uuid",
  name: "My Awesome Mod",
  createdAt: "ISO date",
  updatedAt: "ISO date",
  meta: { name, description, author },
  softwareTypes: [SoftwareType],
  companyTypes: [CompanyType],
  nameGenerators: [NameGenerator],
  personalities: PersonalityGraph | null
};
```

### 5.2 SoftwareType (Complete)

```javascript
const SoftwareType = {
  // Root
  Name: "",
  Description: "",
  Override: null, // "True" | "Delete" | null
  Category: "", // deprecated, show warning
  Unlock: 1990,
  Random: 0.5,
  IdealPrice: 50,
  OptimalDevTime: 40,
  Popularity: 0.5,
  Retention: 24,
  Iterative: 0.75,
  OSSupport: "True", // string: "True" | "False" | "Computer" | "[ Computer; Console ]"
  OneClient: false,
  InHouse: false,
  NameGenerator: "",
  SubmarketNames: ["Gameplay", "Graphics", "Story"],
  Hardware: false,
  
  // Nested
  Categories: [],
  Features: [], // SpecFeatures
  AddOns: [],
  Manufacturing: null
};

const SpecFeature = {
  Name: "",
  Spec: "",
  Description: "",
  Dependencies: "",
  Unlock: 1990,
  DevTime: 5,
  CodeArt: 0.5,
  Submarkets: [1, 1, 1],
  Server: 0,
  Optional: false,
  SoftwareCategories: "",
  Features: [] // SubFeatures
};

const SubFeature = {
  Name: "",
  Description: "",
  Level: 1, // 1, 2, or 3
  Unlock: 1990,
  DevTime: 3,
  CodeArt: 0.5,
  Submarkets: [1, 1, 1],
  Server: 0,
  SoftwareCategories: "",
  // Level 3 only:
  Scripts: {
    Script_EndOfDay: "",
    Script_AfterSales: "",
    Script_OnRelease: "",
    Script_NewCopies: "",
    Script_WorkItemChange: ""
  },
  RunType: "Local"
};
```

### 5.3 TyD Serialization Rules

1. **Indentation:** 1 tab per nesting level
2. **Strings with spaces** → wrap in `""`
3. **Booleans** → `True` / `False` (capitalized)
4. **Arrays** → `[ Item1; Item2 ]` (space after semicolon)
5. **Numbers** → raw, no quotes
6. **Omit empty/null fields** entirely
7. **Submarkets for Level 3** → output `0` (not an array)
8. **Order matters** for readability (follow wiki convention)

---

## 6. AI Assistant (BYOK)

### 6.1 Supported Providers

| Provider | Endpoint | Auth | Notes |
|----------|----------|------|-------|
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | Bearer token | Standard, reliable |
| **Anthropic** | `https://api.anthropic.com/v1/messages` | x-api-key | Claude models |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/models/...` | key query param | Free tier available |
| **Ollama** | `http://localhost:11434/api/generate` | None | Local, no CORS by default |
| **OpenRouter** | `https://openrouter.ai/api/v1/chat/completions` | Bearer token | Universal access |
| **Custom** | User-defined URL | Bearer or None | LM Studio, etc. |

### 6.2 Security Model

- API key stored in **localStorage** only
- Key never transmitted to any server **except** the chosen LLM provider
- UI shows clear warning: "Your key is stored locally in your browser. Never share it."
- "Forget Key" button clears localStorage immediately

### 6.3 AI Features

| Feature | Trigger | What AI Does |
|---------|---------|--------------|
| **Generate SoftwareType** | Dashboard "✨ Create with AI" | Given a description, generates a complete, balanced SoftwareType JSON |
| **Generate Feature** | "🤖" button next to "Add Feature" | Given a spec name, generates Name, Description, DevTime, Submarkets, SubFeatures |
| **Generate SubFeature** | "🤖" button in SubFeature card | Generates a child feature with appropriate level and values |
| **Generate CompanyType** | "🤖" button in CompanyType editor | Creates a CompanyType matching the software types in the project |
| **Balance Check** | "⚖️ Check Balance" button | Analyzes features and suggests submarket adjustments |
| **Explain Field** | ⓘ → "Ask AI" | Explains what a field does with game-specific examples |
| **Generate Name Generator** | "🤖" in NameGen editor | Creates a themed name generator (fantasy, tech, etc.) |

### 6.4 Prompt Engineering Strategy

Each prompt is carefully crafted to return **structured JSON** that our app can parse and populate into forms:

```javascript
// Example: Generate Feature prompt
const prompt = `You are an expert Software Inc. modder.
Given a software type "${softwareName}" with submarkets [${submarkets.join(", ")}],
generate a SpecFeature (specialization feature) for the "${specName}" specialization.

Return ONLY a JSON object matching this exact structure:
{
  "Name": "Feature display name",
  "Spec": "${specName}",
  "Description": "Tooltip description",
  "DevTime": 5,
  "CodeArt": 0.5,
  "Submarkets": [1, 1, 1],
  "Optional": false,
  "SubFeatures": [
    {
      "Name": "Subfeature name",
      "Description": "...",
      "Level": 1,
      "DevTime": 3,
      "CodeArt": 0.5,
      "Submarkets": [1, 0, 1]
    }
  ]
}

Rules:
- DevTime should be balanced (3-8 for SpecFeature, 2-5 for SubFeature)
- Submarkets should add up to meaningful ratios
- CodeArt: 1 = programmers only, 0 = artists only, 0.5 = balanced
- Generate 2-3 subfeatures
- Make descriptions flavorful but concise`;
```

### 6.5 Ollama / Local LLM Support

Since Ollama runs locally and may have CORS issues, we provide:
- Clear instructions on enabling CORS in Ollama
- A fallback "Manual Paste" mode: AI generates in a popup, user copies JSON into a paste box
- Support for `mode: 'no-cors'` fetch with graceful degradation

---

## 7. Validation System

### 7.1 Real-Time Validation

```javascript
const validators = {
  Name: (v) => v.length > 0 || "Name is required",
  SubmarketNames: (v) => v.length === 3 || "Exactly 3 submarket names required",
  Submarkets: (v) => v.length === 3 || "Exactly 3 submarket values required",
  DevTime: (v) => v > 0 || "DevTime must be positive",
  CodeArt: (v) => v >= 0 && v <= 1 || "CodeArt must be 0-1",
  Level: (v) => [1,2,3].includes(v) || "Level must be 1, 2, or 3"
};
```

### 7.2 Warnings (Non-Blocking)

- "No CompanyType defined for this SoftwareType — AI won't release it"
- "Root Popularity is set but Categories are defined — Popularity will be ignored"
- "OptimalDevTime is ${x} but total feature dev time is only ${y} — may not reach 100% satisfaction"
- "Level 3 feature selected — AI will never choose this feature"

### 7.3 Console Command Generator

Based on current mod project:
```
Test in-game:
RELOAD_MOD "${modName}"
TEST_DEV_MOD "${modName}" "${softwareName}" Default
CHECK_SPEC_REP "${modName}"
```
One-click copy button.

---

## 8. Presets

### 8.1 SoftwareType Presets

| Preset | Random | Retention | OptimalDevTime | Submarkets | Popularity |
|--------|--------|-----------|----------------|------------|------------|
| 🎮 Video Game | 0.5 | 24 | 40 | Gameplay/Graphics/Story | 0.6 |
| 🖥️ Operating System | 0.0 | 72 | 75 | Stability/Compatibility/Speed | 1.0 |
| 🎨 2D Editor | 0.3 | 36 | 50 | Features/Ease/Performance | 0.5 |
| 🏢 Office Suite | 0.2 | 48 | 60 | Features/Compatibility/Price | 0.7 |
| 📱 Mobile App | 0.4 | 18 | 25 | UX/Performance/Features | 0.5 |
| 🎵 Audio Tool | 0.3 | 36 | 45 | Quality/Features/Ease | 0.4 |
| 🕸️ Web Browser | 0.2 | 60 | 55 | Speed/Security/Features | 0.8 |
| 🎮 Console (Hardware) | 0.1 | 84 | 90 | Power/Price/Games | 0.9 |

### 8.2 Preset Loading

When user selects a preset:
1. Fill root fields with preset values
2. Add 2-3 example SpecFeatures with appropriate Specs
3. Add 2 SubFeatures per SpecFeature
4. User edits names/descriptions to match their vision

---

## 9. Storage & Persistence

### 9.1 Project Save Format

```javascript
// Saved to localStorage as "simc_projects"
[
  {
    id: "proj_abc123",
    name: "MyRPGMod",
    updatedAt: "2026-06-28T...",
    data: { /* full project object */ }
  }
]
```

### 9.2 Export Options

1. **Download Single File** — Just the current `.tyd` or `.txt`
2. **Export Project as .zip** — Full folder structure:
   ```
   MyRPGMod/
   ├── meta.tyd
   ├── SoftwareTypes/
   │   └── RPG.tyd
   ├── CompanyTypes/
   │   └── GameDev.tyd
   └── NameGenerators/
       └── rpgnames.txt
   ```
3. **Save to Browser** — Quick save to localStorage
4. **Copy to Clipboard** — Copy raw TyD text

### 9.3 Import

- **Import .zip** — Read zip, extract files, attempt to parse TyD back into forms
- **Import Project** — Load a previously saved project from localStorage
- **Load Single .tyd** — Upload a `.tyd` file to edit (basic parser)

---

## 10. Accessibility & Responsive

- **Keyboard navigation** — Tab through all form fields logically
- **Screen readers** — Proper labels, ARIA states for accordions
- **Mobile** — Stack split-pane vertically on small screens
- **Touch** — Buttons large enough for touch (min 44px)
- **Reduced motion** — Respect `prefers-reduced-motion`

---

## 11. Implementation Order

### Sprint 1: Foundation
1. `css/studio.css` — Design system, dark mode
2. `js/tyd-engine.js` — Complete serializer with all fields
3. `js/presets.js` — 8 presets
4. `js/studio.js` — Shared nav, storage, dark mode

### Sprint 2: Core Editors
5. `index.html` — Dashboard with presets, recent projects
6. `software-type.html` — Full dynamic editor with live preview
7. Update `SoftwareIncModCreatorMainPage.html` — Add banner to new

### Sprint 3: AI Integration
8. `js/ai-assistant.js` — Provider configs, API calls, prompt templates
9. Add AI buttons to all editors
10. AI settings modal

### Sprint 4: Complete the Suite
11. `company-type.html` — Updated with all fields
12. `name-generator.html` — Tree editor + AI
13. `personalities.html` — Trait picker, relationship map
14. `meta-editor.html` — Simple metadata form

### Sprint 5: Polish
15. TyD parser for import
16. Full `.zip` export with folder structure
17. Validation warnings panel
18. Console command helper
19. Mobile responsiveness pass

---

*This document serves as the blueprint. Implementation begins with Sprint 1.*
