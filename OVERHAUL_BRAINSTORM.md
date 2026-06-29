# Software Inc Mod Creator — Overhaul Brainstorm

> **Living document for planning the next version of the mod creator.**
> Based on full review of official Data Modding docs + live site analysis.

---

## 1. The Core Problem

The current tool is a collection of **static HTML forms** that map 1:1 to a TyD file structure. This was a great MVP, but it has hit a wall:

- **Hardcoded structure:** Exactly 3 features, exactly 3 subfeatures each. Real mods need flexibility.
- **No feedback loop:** You fill out a massive form, hit download, and *hope* the TyD is right. No preview, no validation, no testing hints.
- **Incomplete coverage:** The docs support Software Categories, Add-ons, Hardware/Manufacturing, Level 3 scripts, Personalities, and `meta.tyd`. The tool supports none of these.
- **Duplicated code:** Full vs Mini versions share 80% of their logic but are copy-pasted.
- **No edit capability:** You can't load an existing `.tyd` back into the tool.

**The game expects precise, nested TyD with specific keys, indentation, and data types. One wrong key (like `OsSupport` instead of `OSSupport`) and the mod silently fails.**

---

## 2. Philosophy: From "Form Filler" to "Mod Studio"

The overhaul should shift from "fill out this form and download a file" to **"build, preview, validate, and export a complete mod package."**

### 2.1 New Mental Model

Think of it like this:

```
A "Mod" is a project containing:
  ├── meta.tyd (mod metadata)
  ├── SoftwareTypes/ (0 or more software types)
  │   └── Each with: Categories, Features (Spec+Sub), Add-ons, Hardware
  ├── CompanyTypes/ (0 or more company types)
  ├── NameGenerators/ (0 or more name generators)
  └── Personalities.tyd (optional)
```

The tool should let you **create and manage a full mod project** in the browser, then export the entire folder structure as a `.zip` — not just individual `.tyd` files.

### 2.2 Key UX Principles

1. **Live Preview First** — Every keystroke updates a syntax-highlighted TyD preview.
2. **Validation as You Type** — Red borders, inline errors, not just `required` attributes.
3. **Progressive Disclosure** — Don't show Add-ons or Hardware fields unless the user opts in.
4. **Templates & Presets** — "Start from: Game, OS, Tool, Console, Phone App"
5. **Project Persistence** — Save/load the entire mod project (JSON to localStorage or file).
6. **One Source of Truth** — Shared JS/CSS. No more Full vs Mini. One dynamic generator.

---

## 3. Architecture Proposal

### 3.1 Tech Stack (Keep it Simple)

Since it's on GitHub Pages, we **must** stay 100% client-side. No build step if possible.

**Option A: Vanilla JS + Components (Recommended)**
- Keep vanilla JS for zero build complexity.
- Use **Web Components** or simple JS "component" functions to dynamically add/remove feature blocks.
- One shared `tyd-engine.js` that handles all TyD serialization.
- One shared `styles.css` with dark mode.
- **Monaco Editor** (VS Code's editor) for the live preview — it's CDN-loadable and gives syntax highlighting + error squiggles for free.

**Option B: Lightweight Framework (If we want nicer state management)**
- **Alpine.js** — Works with zero build, perfect for progressive enhancement.
- Or **Vue 3 via CDN** — A bit heavier but excellent for dynamic forms.

**Recommendation:** Start with Vanilla JS + Alpine.js for reactivity without a build step.

### 3.2 File Structure

```
/
├── index.html                     # Landing + project manager
├── app/
│   ├── css/
│   │   └── main.css               # All styles, dark mode, responsive
│   ├── js/
│   │   ├── main.js                # App bootstrap, routing
│   │   ├── tyd-engine.js          # TyD parser, validator, serializer
│   │   ├── data-model.js          # Default schemas, presets
│   │   ├── ui-components.js       # Reusable form builders
│   │   └── storage.js             # localStorage save/load
│   └── lib/
│       ├── alpine.min.js          # (optional) Alpine.js
│       └── monaco-editor/         # (CDN or local) for preview
├── editors/
│   ├── software-type.html         # Unified software type editor
│   ├── company-type.html          # Company type editor
│   ├── name-generator.html        # Name generator editor
│   ├── personalities.html         # NEW: Personality editor
│   └── meta-editor.html           # NEW: Mod metadata editor
└── assets/
    └── ...                        # Icons, logos
```

---

## 4. Feature Deep-Dive: What We Need to Support

Based on the **complete** Data Modding documentation, here is every mod type and field the tool should handle:

### 4.1 SoftwareType (The Big One)

**Root Fields:**
| Field | Type | UI Control | Notes |
|-------|------|------------|-------|
| `Name` | string | Text input | **Required**. Quoted in TyD. |
| `Description` | string | Textarea | Quoted. |
| `Override` | enum | Select: "Add New" / "Override" / "Delete" | Omit for new mods. |
| `Category` | string | Text input | **Deprecated as of Beta 1**. Show warning. |
| `Categories` | array | Dynamic list of category blocks | Optional. If present, overrides root Popularity/Retention/Iterative. |
| `Unlock` | int | Number input | Year, e.g. 1995. |
| `Random` | float | Slider 0-1 + number input | Sales variance. |
| `IdealPrice` | float | Number input | Optional if categories define it. |
| `OptimalDevTime` | int | Number input | Employee-months. 40 for games, 75 for OS. |
| `Popularity` | float | Slider 0-1 + number input | Ignored if categories defined. |
| `Retention` | int | Number input | Months. Ignored if categories defined. |
| `Iterative` | float | Slider 0-1 + number input | AI sequel chance. Ignored if categories defined. |
| `OSSupport` | mixed | Text input with examples | `True`, `False`, `Computer`, `[ Computer; Console ]` |
| `OneClient` | bool | Toggle | Contract work? |
| `InHouse` | bool | Toggle | Internal use only? |
| `NameGenerator` | string | Text input | **NO `.txt` suffix** per docs. |
| `SubmarketNames` | string[3] | 3 text inputs or "Gameplay; Graphics; Story" | Format: `[ "A"; "B"; "C" ]` |
| `Hardware` | bool | Toggle | If true, Manufacturing section appears. |
| `Features` | array | Dynamic SpecFeature blocks | The core of the mod. |
| `AddOns` | array | Dynamic AddOn blocks | Optional. |

**SpecFeature (Level 0):**
| Field | Type | UI Control |
|-------|------|------------|
| `Name` | string | Text input |
| `Spec` | string | Text input (e.g., 3D, Audio, Network) |
| `Description` | string | Textarea |
| `Dependencies` | string or string[] | Text input (allow comma-separated) |
| `Unlock` | int | Number input |
| `DevTime` | int | Number input |
| `CodeArt` | float | Slider 0-1 |
| `Submarkets` | float[3] | 3 number inputs |
| `Server` | float | Number input | mbps per user |
| `Optional` | bool | Toggle | Can player deselect? |
| `SoftwareCategories` | mixed | Text input | `[ Computer; Console ]` or with years |
| `Features` | array | Dynamic SubFeature blocks | **Add/remove freely** |

**SubFeature (Level 1-2):**
Same as SpecFeature but:
- `Level` instead of `Spec` (1 or 2)
- No `Optional`, `Dependencies`, `Spec`

**Level 3 Features (Scripted):**
- `Level` = 3
- `Submarkets` = `0` (hardcoded, no input needed)
- **Script entry points:**
  - `Script_EndOfDay`
  - `Script_AfterSales`
  - `Script_OnRelease`
  - `Script_NewCopies`
  - `Script_WorkItemChange`
- **RunType:** Local / Host / Everyone
- UI: Code editor (textarea with monospace) for each script entry point.

**Software Categories (Optional but Important):**
Each category has:
- Name, Description, Unlock, Popularity, Submarkets[3], TimeScale, Retention, IdealPrice, Iterative, NameGenerator

**Add-ons:**
- Name, Description, Unlock, Categories, OptimalDevTime, Retention, Forced, PerUser, IdealPrice, BaseFeature, NameGenerator
- Features list (same structure as main features but with `MaxFactor`, `AmountScript`, `DependsOn`)
- Manufacturing (for hardware add-ons)

**Hardware / Manufacturing:**
- `Hardware True` toggle
- `Components` list: Name, Thumbnail (file picker or path string), BuiltInThumbnail (dropdown of built-ins), Price, Time, DependsOn, DependencyFactor
- `Processes` list: Inputs[], Output
- `FinalTime`, `Design`, `FeatureBinding`

### 4.2 CompanyType

Current tool is close but missing:
- `Addons` list (Software, Addon, Chance)
- `NameGen` field
- `Force` on Types entries
- `Category` on Types entries

### 4.3 Name Generators

Current tool only does a linear `-start → -base → -base2 → -end`.

Real generators need:
- **Dynamic node creation:** Add any number of nodes.
- **Node connections:** Define which nodes each node can transition to.
- **Raw text mode:** For power users, just a big textarea.
- **Preview:** Generate 10 random names from the current generator.

### 4.4 Personalities (Currently Missing)

- `PersonalityGraph` root with optional `Replace True`
- `Personalities` list: Name, Traits[1-2], Relationships map
- `Incompatibilities` list: pairs of personalities
- Trait picker: Dropdown of all 28 traits, color-coded (Good/Bad/Neutral)

### 4.5 Meta.tyd (Currently Missing)

Simple but critical:
- `Name`, `Description`, `Author`

### 4.6 Localizations (Nice-to-Have)

The game can generate these via `GENERATE_LOCALIZATION` console command, but having a basic localization editor would be pro-level.

---

## 5. UX Overhaul Ideas

### 5.1 The "Project Dashboard"

Instead of separate disconnected pages, the main page becomes a **project manager**:

```
┌─────────────────────────────────────────────┐
│  Software Inc Mod Studio          [Dark 🌙] │
├─────────────────────────────────────────────┤
│                                             │
│  📁 MyAwesomeMod                     [⚙️]  │
│  ├── 📄 meta.tyd                      [✏️]  │
│  ├── 📁 SoftwareTypes/                      │
│  │   ├── 📄 RPG.tyd                   [✏️]  │
│  │   └── 📄 Strategy.tyd             [✏️]  │
│  ├── 📁 CompanyTypes/                       │
│  │   └── 📄 GameDev.tyd              [✏️]  │
│  ├── 📁 NameGenerators/                     │
│  │   └── 📄 rpgnames.txt             [✏️]  │
│  └── 📄 Personalities.tyd             [✏️]  │
│                                             │
│  [ + Add Software Type ]                    │
│  [ + Add Company Type ]                     │
│  [ + Add Name Generator ]                   │
│  [ + Add Personalities ]                    │
│                                             │
│  [ 💾 Save Project ] [ 📂 Load Project ]    │
│  [ 📦 Export Mod as .zip ]                  │
└─────────────────────────────────────────────┘
```

### 5.2 The Editor Layout (Split Pane)

Each editor page uses a **split-pane layout**:

```
┌─────────────────────────┬──────────────────┐
│                         │                  │
│   FORM FIELDS           │   LIVE PREVIEW   │
│   (scrollable)          │   (Monaco editor │
│                         │    with TyD      │
│   [Feature 1]           │    highlighting) │
│   [Feature 2]           │                  │
│   [+ Add Feature]       │   [📋 Copy]      │
│                         │   [⬇️ Download]  │
│                         │                  │
└─────────────────────────┴──────────────────┘
```

### 5.3 Progressive Disclosure with Cards/Accordions

Instead of one giant scrolling form:

- **Basic Info** (always visible)
- **Categories** (collapsed by default, toggle to add)
- **Features** (each SpecFeature is a card that can expand/collapse)
- **SubFeatures** (nested inside each SpecFeature card)
- **Add-ons** (collapsed by default)
- **Hardware** (collapsed by default, only shown if Hardware toggle is on)
- **Scripts** (only shown for Level 3 subfeatures)

### 5.4 Inline Help System

Instead of paragraphs below every label:
- **ⓘ Info icons** next to labels that show a tooltip/popover on hover.
- **Link to wiki** in each tooltip.
- **Console command hints:** If you're making a SoftwareType, show "Tip: Use `TEST_DEV_MOD MyMod RPG Default` in-game to verify balancing."

### 5.5 Validation & Error Reporting

- **Red borders** on fields that are empty but required.
- **Inline errors:** "Submarkets must have exactly 3 values"
- **TyD validation:** Try to catch common mistakes:
  - Unquoted strings with spaces
  - `OsSupport` vs `OSSupport`
  - Missing required root fields
  - Feature names that are empty
- **Warnings (yellow):**
  - "You defined Categories but also set root-level Popularity — Popularity will be ignored."
  - "You have 3 SubmarketNames but Feature X only satisfies 2 submarkets."
  - "No CompanyType defined for this SoftwareType — AI will not release it."

### 5.6 Preset System

**Built-in presets** that auto-fill all fields with balanced values:

| Preset | Description |
|--------|-------------|
| 🎮 Video Game | High Random, low Retention, Gameplay/Graphics/Story submarkets |
| 🖥️ Operating System | Low Random, high Retention, OSSupport False |
| 🎨 2D Editor | Tool-type, InHouse True, CodeArt balanced |
| 🏢 Business Software | Low Random, contract-work friendly |
| 📱 Mobile App | Short OptimalDevTime, phone OS support |
| 🎮 Console (Hardware) | Hardware True, Manufacturing enabled |

Clicking a preset fills everything and the user just tweaks names/descriptions.

### 5.7 In-App Console Command Generator

A sidebar panel that generates debugging commands based on your current mod:

```
Test your mod in-game:
RELOAD_MOD MyAwesomeMod
TEST_DEV_MOD MyAwesomeMod "RPG" Default
CHECK_SPEC_REP MyAwesomeMod
```

One-click copy.

---

## 6. Data Model (JavaScript)

The app should work with a clean JS object model that mirrors TyD structure:

```javascript
const defaultSoftwareType = {
  Name: "",
  Description: "",
  Random: 0.5,
  OSSupport: "True", // can be bool, string, or array
  Popularity: 0.5,
  Retention: 24,
  IdealPrice: 50,
  OptimalDevTime: 40,
  SubmarketNames: ["Gameplay", "Graphics", "Story"],
  Iterative: 0.75,
  NameGenerator: "",
  OneClient: false,
  InHouse: false,
  Unlock: 1990,
  Hardware: false,
  Categories: [],
  Features: [], // SpecFeatures
  AddOns: [],
  Manufacturing: null
};

const defaultSpecFeature = {
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

const defaultSubFeature = {
  Name: "",
  Description: "",
  Level: 1,
  Unlock: 1990,
  DevTime: 3,
  CodeArt: 0.5,
  Submarkets: [1, 1, 1],
  Server: 0,
  SoftwareCategories: "",
  Scripts: {}, // { Script_EndOfDay: "", Script_AfterSales: "", ... }
  RunType: "Local"
};
```

**The TyD serializer** takes this object and outputs properly formatted, tab-indented TyD.

**The TyD parser** takes existing `.tyd` text and populates this object model.

---

## 7. Critical Bug Fixes (Immediate)

These must be fixed regardless of the overhaul scope:

1. **`OsSupport` → `OSSupport`** in `softwareIncModCreatorSoftwareType.html`
2. **NameGenerator `.txt` suffix** — Docs say no `.txt`. Standardize both generators.
3. **Quote all string values** — `Name`, `Description`, `Dependencies`, etc. must be quoted in output.
4. **Robust submarket parsing** — Accept spaces, commas, semicolons, tabs as separators. Filter empty strings.
5. **Add `required` validation** — At minimum, `Name` must not be empty.
6. **Fix `f1Subfeature1Spec` label/ID mismatch** — The label says "Level" but the ID says `Spec`. Consistent naming.
7. **CompanyType `Category` and `Force` fields** — Missing from current generator.

---

## 8. Implementation Phases

### Phase 0: Emergency Fixes (Now)
- Fix the 7 critical bugs listed above.
- These are safe, low-risk changes.

### Phase 1: Foundation (Shared Code)
- Extract all shared CSS into `styles.css`.
- Extract all shared JS into `tyd-engine.js` (serializer + parser).
- Create a single dynamic SoftwareType editor that replaces both Full and Mini.
- Add live `<pre>` preview panel (no Monaco yet, just a styled `<pre>`).

### Phase 2: Dynamic Forms
- Add/remove SpecFeatures dynamically.
- Add/remove SubFeatures dynamically.
- Add/remove Software Categories.
- Collapsible card UI for features.

### Phase 3: New Generators
- `meta.tyd` editor.
- `Personalities` editor.
- Enhanced `Name Generator` with dynamic nodes.
- Enhanced `CompanyType` with Addons and NameGen.

### Phase 4: Project System
- Project dashboard (index.html overhaul).
- Save/load project to localStorage.
- Export entire mod as `.zip`.
- Preset system.

### Phase 5: Polish
- Monaco Editor for preview.
- Full TyD parser (load existing `.tyd` files).
- Dark mode.
- Console command helper.
- Hardware/Manufacturing editor (advanced).

---

## 9. Open Questions

1. **NameGenerator `.txt`:** The docs clearly say "minus '.txt'". But if the user says the game needs it, we should verify with the actual Beta data files. The Beta 1.7.15 data download should show real examples.
2. **TyD Parser Complexity:** Writing a full TyD parser in JS is non-trivial. For Phase 1, we only need serialization. Parsing can come later. Should we attempt it?
3. **Framework:** Is Alpine.js acceptable, or should we stay pure vanilla? The user wants it "way more intuitive" — a little reactivity goes a long way.
4. **Scope:** Should Hardware/Manufacturing and Add-ons be in the initial overhaul, or saved for a v2?
5. **Zip Export:** The current site already has a zip download. We can use JSZip (CDN) to generate the full mod folder structure as a zip in the browser.

---

## 10. Name Generator — Specific Deep Dive

The user specifically asked about this. Let me be very precise:

**What the docs say:**
> "Generators will be loaded from txt files located in the 'NameGenerators' folder and **their name will match their file names, minus '.txt'**."

**What the docs example shows:**
```tyd
NameGenerator		testgen
```

**What the current code does:**
- Full generator: outputs `NameGenerator mygen.txt` (WRONG per docs)
- Mini generator: outputs `NameGenerator mygen` (CORRECT per docs)

**Recommendation:** Standardize on **NO `.txt`** in the TyD reference. The game handles the extension. However, the file itself saved to `NameGenerators/` **must** be `.txt`.

The current `Name_Generator.html` downloads `.txt` files correctly. It just needs the UI to make it clear: "Reference name (no extension)" vs "File name (with .txt)".

---

*This document is a brainstorm. Not all features need to be built at once. The goal is to agree on direction before writing code.*
