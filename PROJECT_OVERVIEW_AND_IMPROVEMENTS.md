# Software Inc Mod Creator - Project Overview & Improvement Plan

> **Internal planning document.**  
> This file is in `.gitignore` and should not be committed.

---

## 1. Project Overview

The **Software Inc Mod Creator** is a client-side, browser-based HTML/CSS/JavaScript toolkit that helps modders generate TyD files for the game *Software Inc.* (by Coredumping). It provides fillable forms for common mod types and outputs formatted `.tyd` or `.txt` files for download.

### 1.1 File Structure

```
Software-Inc-Mod-Creator-main/
├── index.html                              # Landing/welcome page
├── SoftwareIncModCreatorMainPage.html      # Main hub with links and docs
├── softwareIncModCreatorSoftwareType.html  # Full software type generator (3 features, 3 subfeatures each)
├── softwareIncModCreatorSoftwareMini.html  # Mini software type generator (1 feature, 3 subfeatures)
├── CompanyType.html                        # AI company type generator
├── Name_Generator.html                     # Name generator .txt builder
├── SoftwareIncFolderStructureAndExamples.zip  # Downloadable template
├── BitcoinIcon.png / BitcoinQRCode.png     # Donation assets
└── .gitignore                              # (New) Ignore internal docs
```

### 1.2 Current Tech Stack

- **Pure HTML5** - No build step, no framework (besides Bootstrap 5.2.3 CDN).
- **Vanilla JavaScript** - Inline `<script>` tags, DOM manipulation.
- **Bootstrap 5.2.3** - UI styling via CDN.
- **No backend** - Everything runs in the browser; files generated via `Blob`/`data:` URIs.

### 1.3 Current Generators

| Generator | Output | Notes |
|-----------|--------|-------|
| **Software Type (Full)** | `.tyd` | 3 SpecFeatures, each with 3 SubFeatures. Fixed structure. |
| **Software Type (Mini)** | `.tyd` | 1 SpecFeature with 3 SubFeatures. Fixed structure. |
| **Company Type** | `.tyd` | Basic CompanyType with 3 software entries. |
| **Name Generator** | `.txt` | Simple 3-node tree (`-start`, `-base`, `-base2`, `-end`). |

---

## 2. Current Strengths

1. **Zero Setup** - Open HTML in browser and it works. Great for non-technical users.
2. **Bootstrap UI** - Clean, responsive, mobile-friendly forms.
3. **Helpful Inline Docs** - Each field has a `<p>` description explaining what it does and giving game examples.
4. **Immediate Download** - One-click file generation and download.
5. **Examples Included** - The zip file provides a starter folder structure.

---

## 3. Critical Issues & Improvement Areas

### 3.1 🐛 BUGS & OUTPUT CORRECTNESS

These are the highest priority because broken TyD files won't load in the game.

#### Issue 3.1.1: Inconsistent `OSSupport` Key Name
- **File:** `softwareIncModCreatorSoftwareMini.html` uses `OSSupport` (line 322).
- **File:** `softwareIncModCreatorSoftwareType.html` uses `OsSupport` (line 571).
- **Game Expectation:** Per the wiki, the key is `OSSupport` (all caps `OS`).
- **Risk:** The game may not recognize `OsSupport` and ignore it.
- **Fix:** Standardize to `OSSupport` everywhere.

#### Issue 3.1.2: Missing Quotes Around Feature Names
- **File:** `softwareIncModCreatorSoftwareType.html` lines 581-582, 615-616, 649-650.
- **Problem:** `Name` and `Spec` values for SpecFeatures are **not** wrapped in quotes.
- **Game Expectation:** The wiki example shows:
  ```tyd
  Name 		"Test feat 1"
  Spec 		System
  ```
  - `Name` has quotes because it has spaces.
  - `Spec` does *not* have quotes because it's a single word.
- **Risk:** If a user enters a feature name with spaces (e.g., "3D Graphics"), the TyD will be invalid because it's unquoted. However, single-word names work fine.
- **Fix:** Always quote `Name` fields. `Spec` can remain unquoted (single words only).

#### Issue 3.1.3: Subfeature `Spec` Field Actually Represents `Level`
- **File:** Both software generators label the subfeature field as `Spec` in the HTML, but output it as `Level` in TyD.
- **Problem:** This is actually *correct* behavior (the field should be `Level` for subfeatures), but the UI label is confusing. The description text correctly explains it's the level, but the `<label>` says "Level" which is actually right. Wait - looking closer:
  - In `softwareIncModCreatorSoftwareType.html`, the subfeature labels are:
    - `f1Subfeature1Spec` with label "Level" ✅
    - It outputs `Level    ${f1Subfeature1Spec}` ✅
  - This is actually okay, just an odd ID name.
- **Verdict:** Not a bug, but the input IDs (`f1Subfeature1Spec`) are misleading. Low priority.

#### Issue 3.1.4: `NameGenerator` Extension Inconsistency
- **File:** `softwareIncModCreatorSoftwareType.html` line 578 appends `.txt`:
  ```js
  NameGenerator    ${NameGenerator}.txt
  ```
- **File:** `softwareIncModCreatorSoftwareMini.html` line 329 does **not** append `.txt`:
  ```js
  NameGenerator    ${NameGenerator}
  ```
- **Game Expectation:** In TyD, `NameGenerator` should be the filename **without** extension. The game looks in `NameGenerators/` folder and appends `.txt` itself.
- **Risk:** `NameGenerator mygen.txt` might cause the game to look for `mygen.txt.txt`.
- **Fix:** Remove `.txt` suffix from the full generator.

#### Issue 3.1.5: Submarket Formatting Assumes Space Separation
- **Current Logic:** `value.split(" ").map(word => word.trim()).join('; ')`
- **Problem:** If a user enters `1, 2, 3` or `1\t2\t3` or `1;2;3`, the formatter breaks.
- **Fix:** Be more robust - accept spaces, commas, semicolons, and tabs as separators.

#### Issue 3.1.6: No Validation Before Download
- **Problem:** Users can click "Download" with empty required fields, producing invalid TyD (e.g., empty `Name`, empty `SubmarketNames`).
- **Fix:** Add HTML5 `required` attributes and/or JS validation. At minimum, `Name` and `SubmarketNames` should be validated.

#### Issue 3.1.7: CompanyType File Naming
- **File:** `CompanyType.html`
- **Problem:** The download filename is `${companyType}.tyd`, but `companyType` is described as "the name of the file". However, the TyD root is `CompanyType`, and inside it the key is `Specialization`. The filename doesn't strictly matter for the game, but it could confuse users.
- **Fix:** Clarify UI label: "File Name (also used as Specialization if left blank)" or similar.

#### Issue 3.1.8: `SubmarketNames` Formatting May Break with Extra Spaces
- **Current Logic:** `value.split(" ").map(word => `"${word.trim()}"`).join('; ')`
- **Problem:** Multiple consecutive spaces create empty entries. E.g., "A  B   C" → `["A"; ""; "B"; ""; ""; "C"]`.
- **Fix:** Filter out empty strings after split.

---

### 3.2 🎨 UX & INTUITIVENESS

#### Issue 3.2.1: Fixed Number of Features/Subfeatures
- **Problem:** Both generators have a hardcoded number of features (3/1) and subfeatures (3 each). Real mods may need more or fewer.
- **Fix:** Use dynamic JavaScript to add/remove feature/subfeature sections. "Add Feature" / "Remove Feature" buttons.

#### Issue 3.2.2: No Live Preview
- **Problem:** Users can't see the generated TyD until they download it. If there's a mistake, they have to re-download.
- **Fix:** Add a live preview panel ( Monaco/CodeMirror or just a `<pre>` block) that updates on input change.

#### Issue 3.2.3: No "Load Existing Mod" Support
- **Problem:** If a user has an existing `.tyd` file, they can't edit it with this tool. They have to start from scratch.
- **Fix:** Add a file upload + parser that populates the form from an existing TyD file.

#### Issue 3.2.4: Missing Mod Types
- **Problem:** The tool only supports SoftwareType, CompanyType, and NameGenerator. Many mod types are missing:
  - **Personalities** (employee traits)
  - **Software Categories** (within a SoftwareType)
  - **Add-ons** (software/hardware add-ons)
  - **Hardware / Manufacturing** (components, processes)
  - **Localization** files
  - **`meta.tyd`** (mod metadata)
- **Fix:** Add generators for these. At minimum, `meta.tyd` and `Personalities` would be very helpful.

#### Issue 3.2.5: `OSSupport` Limited to True/False Dropdown
- **Problem:** The game supports `OSSupport True`, `OSSupport False`, `OSSupport Computer`, or `OSSupport [ Computer; Console ]`. The current dropdown only offers `true`/`false`.
- **Fix:** Change to a text input with examples, or a multi-select with custom entry.

#### Issue 3.2.6: No Copy-to-Clipboard
- **Problem:** Downloading a file is the only option. Sometimes users just want to copy the text into an existing mod.
- **Fix:** Add a "Copy to Clipboard" button alongside "Download".

#### Issue 3.2.7: Name Generator is Overly Simplistic
- **Problem:** It only supports a linear `-start → -base → -base2 → -end` tree. Real name generators can have branching, multiple nodes, and complex probabilities.
- **Fix:** Allow users to dynamically add nodes and define transitions. Or at least provide a text area for the raw file.

#### Issue 3.2.8: No Console Command Helper
- **Problem:** The wiki lists very useful debugging commands (`TEST_DEV_MOD`, `CHECK_SPEC_REP`, etc.) that users probably don't know about.
- **Fix:** Add a "Testing Help" section that generates the exact console command based on the current mod's name.

#### Issue 3.2.9: No Presets / Templates
- **Problem:** Every mod starts blank. Users might want to base their mod on existing game types (e.g., "RPG", "Operating System").
- **Fix:** Add preset buttons that auto-fill fields with balanced values from the game's built-in types.

#### Issue 3.2.10: Visual Hierarchy is Weak on Long Forms
- **Problem:** The forms are very long. Feature 1, Subfeature 1, Subfeature 2, Subfeature 3... it all blends together.
- **Fix:** Use Bootstrap cards/accordions for each feature. Collapsible sections. Sticky section headers.

---

### 3.3 🔧 CODE QUALITY & MAINTAINABILITY

#### Issue 3.3.1: Massive Code Duplication
- **Problem:** `softwareIncModCreatorSoftwareType.html` and `softwareIncModCreatorSoftwareMini.html` share ~80% of their code (HTML structure, CSS, JS logic). Changes need to be made in two places.
- **Fix:** Extract common JS and CSS into shared files (`shared.js`, `styles.css`). Use a single parameterized generator page, or at least share the script.

#### Issue 3.3.2: Inline Everything
- **Problem:** All CSS and JS is inline. No external files.
- **Fix:** Move CSS to `styles.css` and JS to `app.js`. This enables caching and easier maintenance.

#### Issue 3.3.3: Brittle DOM Access
- **Problem:** Every field is accessed with `document.getElementById(...)` individually. There are 50+ lines of just variable assignments.
- **Fix:** Use helper functions, FormData, or object mapping.

#### Issue 3.3.4: No Error Handling
- **Problem:** If Bootstrap CDN fails, the page has no styling. If JS throws, the user gets no feedback.
- **Fix:** Add basic error boundaries and fallback styling.

#### Issue 3.3.5: No Semantic HTML
- **Problem:** Missing `<!DOCTYPE html>`, `<html lang="en">`, `<meta charset>` on some pages. `<label for>` IDs have typos in some places.
- **Fix:** Standardize all pages with proper HTML5 boilerplate.

---

## 4. Prioritized Action Plan

### Phase 1: Fix Bugs (Critical - Do First)
1. Fix `OsSupport` → `OSSupport` in `softwareIncModCreatorSoftwareType.html`.
2. Remove `.txt` suffix from `NameGenerator` in full generator.
3. Add quotes around all `Name` fields in generated TyD.
4. Improve `formatSubmarkets` to handle commas, semicolons, and multiple spaces.
5. Add basic HTML5 `required` validation to all forms.
6. Filter empty strings in `formatSubmarketNames`.

### Phase 2: UX Improvements (High Impact)
7. Add **live preview** panel to all generators.
8. Add **Copy to Clipboard** button.
9. Change `OSSupport` from dropdown to text input (with examples/helper).
10. Add collapsible/accordion UI for features to reduce visual clutter.
11. Add a **meta.tyd** generator.
12. Add a console command helper based on mod name.

### Phase 3: New Features & Refactor
13. Create **shared JS/CSS files** to eliminate duplication.
14. Add **dynamic add/remove** for features and subfeatures.
15. Add **preset templates** (e.g., "Game", "OS", "Tool" presets with balanced values).
16. Add **Personalities** generator.
17. Add **Software Categories** support within the SoftwareType generator.
18. Add **file upload/parsing** to edit existing `.tyd` files.

### Phase 4: Polish
19. Add custom offline fallback styles (in case Bootstrap CDN is unavailable).
20. Add a dark mode toggle.
21. Improve mobile experience (some fixed-position buttons overlap on small screens).

---

## 5. Quick Wins (Can Do Immediately)

These are small, safe changes with high value:

- [ ] Fix `OsSupport` → `OSSupport`
- [ ] Fix `NameGenerator` `.txt` suffix
- [ ] Quote all `Name` values in output
- [ ] Robust `formatSubmarkets` (split on `/[,;\s]+/`)
- [ ] Filter empty strings in submarket formatting
- [ ] Add `required` to `Name` inputs
- [ ] Add `.gitignore`
- [ ] Add `meta.tyd` generator page
- [ ] Add Copy-to-Clipboard button
- [ ] Add live `<pre>` preview

---

*Document generated for Software Inc Mod Creator project improvement planning.*
