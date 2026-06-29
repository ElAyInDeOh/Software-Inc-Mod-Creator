# Software Inc. - Modding Research & Context

> **Internal research document for the Software Inc Mod Creator project.**  
> This file is in `.gitignore` and should not be committed.

---

## 1. The Game: Software Inc.

**Software Inc.** is a business simulation/management game where players design, develop, and sell software products. Players hire employees, manage offices, research technologies, and compete in a simulated market against AI companies.

- **Developer:** Coredumping
- **Website:** https://softwareinc.coredumping.com/
- **Wiki:** https://softwareinc.coredumping.com/wiki/index.php/Modding
- **Platform:** PC (Steam)

---

## 2. Modding System Overview

Software Inc. supports mods through:

1. **TyD Files** - A simple, human-readable text-based data format (similar to JSON/YAML but custom).
2. **C# Code Mods** - Advanced mods using `.cs` files or compiled DLLs placed in `DLLMods`.
3. **3D Models** - Furniture mods using `.obj` files.
4. **Textures** - Material mods for walls, floors, roofs, paths.

### 2.1 Folder Structure

Mods are placed in the game's root folder (not Steam Workshop):

```
Software Inc/
├── Mods/                 # Software types, personalities, company types
│   └── MyMod/
│       ├── SoftwareTypes/
│       ├── CompanyTypes/
│       ├── NameGenerators/
│       └── meta.tyd
├── Furniture/            # Furniture mods
├── Materials/            # Texture mods
├── DLLMods/              # C# code mods
└── Localization/         # Translation mods
```

### 2.2 The TyD Format

TyD is a tab-indented format. Key characteristics:
- **Indentation matters** - Uses tabs for nesting.
- **No quotes required** for simple values, but **quotes required** for strings containing spaces.
- **Lists** use `[ Item1; Item2; Item3 ]` syntax.
- **Comments** use `#`.
- **Booleans** are `True` / `False` (case-sensitive).
- **Tables** (objects) are defined with curly braces `{}`.

Example TyD structure:
```tyd
SoftwareType
	{
	Name		"Test Software"
	Description	"This is a test"
	Random		0.1
	OptimalDevTime	25
	SubmarketNames	[ TestMarket1; TestMarket2; TestMarket3 ]
	Features
		[
			{
			Name	"Feature 1"
			DevTime	3
			}
		]
	}
```

**Critical formatting notes:**
- Record names and values are separated by **tabs**.
- Inconsistent indentation or spaces instead of tabs can break parsing.
- The game is **very sensitive** to syntax errors in TyD.

---

## 3. Software Types (Primary Focus of This Tool)

A `SoftwareType` defines a category of software the player can develop.

### 3.1 Core Fields

| Field | Description | Example |
|-------|-------------|---------|
| `Name` | Display name in UI | `"My Game"` |
| `Description` | Tooltip text | `"A cool game"` |
| `Random` | Sales variance (0-1) | `0.5` |
| `OSSupport` | Requires OS? `True`, `False`, or specific categories | `True` or `[ Computer; Console ]` |
| `Popularity` | Max consumer cap (0-1) | `0.6` |
| `Retention` | Months of interest | `24` |
| `IdealPrice` | Ideal cost at 100% quality | `50` |
| `OptimalDevTime` | Ideal dev months (per employee) | `40` |
| `SubmarketNames` | 3 submarket labels | `[ Gameplay; Graphics; Story ]` |
| `Iterative` | AI sequel likelihood (0-1) | `0.75` |
| `NameGenerator` | Name gen file (no extension) | `mygenerator` |
| `OneClient` | Contract work only? | `False` |
| `InHouse` | Internal use only? | `False` |
| `Unlock` | Year unlocked | `1995` |
| `Override` | Override existing type? `True` or `Delete` | omit for new |

### 3.2 Features Structure

```tyd
Features
	[
		{
		Name		"Main Feature"
		Spec		3D
		Description	"Base 3D support"
		DevTime		5
		CodeArt		0.5
		Submarkets	[ 1; 2; 1 ]
		Features
			[
				{
				Name		"Subfeature A"
				Level		1
				Description	"Basic 3D"
				DevTime		3
				CodeArt		0.5
				Submarkets	[ 0; 1; 0 ]
				}
			]
		}
	]
```

**Feature Levels:**
- **Level 0 (SpecFeature):** Base specialization feature. Everyone can work on it.
- **Level 1:** Requires basic education in the specialization.
- **Level 2:** Requires advanced education. More submarket satisfaction.
- **Level 3:** Custom scripts (SIPL). No submarket satisfaction. AI never picks these.

### 3.3 Software Categories (Optional)

Categories allow specialization within a software type (e.g., OS → Computer, Console, Phone).

If categories are defined, `Popularity`, `Retention`, `Iterative` at the root level are **ignored**.

```tyd
Categories
	[
		{
		Name		"Console OS"
		Description	"OS for consoles"
		Popularity	0.8
		Submarkets	[ 1; 1; 1 ]
		Retention	48
		TimeScale	1
		Iterative	0.5
		NameGenerator	consolegen
		}
	]
```

### 3.4 Add-ons

Add-ons are supplementary products. Can be software or hardware-based.

Hardware add-ons use a `Manufacturing` table with `Components` and `Processes`.

### 3.5 Name Generators

Text files in `NameGenerators/` folder. Use a tree structure:

```text
-start(base)
-base(base2,end,stop)
Hello
Hi
-base2(end,stop)
, you
-end(stop)
.
```

Nodes start with `-`. Parentheses list next possible nodes. `stop` ends generation.

---

## 4. Company Types

Defines AI companies that compete in the market.

```tyd
CompanyType
	{
	Specialization	"Game Dev"
	PerYear		0.2
	Min		3
	Max		6
	Frameworks	True
	Types
		[
			{
			Software	"RPG"
			Chance		1
			}
		]
	}
```

| Field | Description |
|-------|-------------|
| `Specialization` | Tag/name. Can override built-in. |
| `PerYear` | Chance of new company per year (0.2 is standard) |
| `Min` | Minimum companies of this type |
| `Max` | Maximum companies of this type |
| `Frameworks` | Will they license frameworks? |
| `Types` | List of software they develop and effort (Chance) |
| `Addons` | List of hardware add-ons they develop |
| `NameGen` | Custom name generator |

**Important:** If you add a new `SoftwareType`, you **must** also add a `CompanyType` for it, or AI companies will never release that software.

---

## 5. Personalities

Employee personality traits. All employees have exactly 2 traits.

```tyd
PersonalityGraph
	{
	Personalities
		[
			{
			Name		"MyPersonality"
			Traits		[ WalkItOff ; SlowEater ]
			Relationships
				{
				Extrovert	-0.5
				}
			}
		]
	Incompatibilities
		[
			[ MyPersonality; Introvert ]
		]
	}
```

---

## 6. Alpha 11+ Changes

Major redesign of the feature system:
- **No feature dependencies** - Features don't depend on each other anymore.
- **Tech levels** control evolution instead.
- Features are more **abstract** (e.g., just "Audio" instead of "PC Speaker", "8-bit audio", "HD audio").
- `SpecFeatures` are the foundation; `SubFeatures` build on them.
- Level 3 features use **SIPL** scripts.

---

## 7. Debugging & Testing

The game has an in-game console (bind a key in options).

**Useful console commands for modders:**

| Command | Purpose |
|---------|---------|
| `RELOAD_MOD X` | Reload mod named X |
| `TEST_DEV_MOD X Y Z` | Test balancing for Software Category Z in Software Y in Mod X |
| `CHECK_SPEC_REP X` | Check if all specialization levels are used |
| `CHECK_ADDON_MARKET X Y Z` | Check if add-on markets are fulfilled |
| `LIST_SCOPE_MEMBERS X` | List variables/methods for script scope X |
| `GENERATE_LOCALIZATION X` | Generate localization files for mod X |
| `INSTA_DEVELOP_DESIGN` | Instantly release current design (modded only) |

---

## 8. Common Pitfalls

1. **TyD Syntax Errors:** Missing quotes around strings with spaces, incorrect tabs, mismatched braces.
2. **Missing Company Types:** New software types without corresponding company types won't appear from AI.
3. **Invalid Submarket Ratios:** Must be exactly 3 values for `SubmarketNames` and feature `Submarkets`.
4. **Feature Balancing:** If `OptimalDevTime` is too low and features don't cover all submarkets, players can't reach 100% satisfaction. Use `TEST_DEV_MOD`.
5. **OSSupport Confusion:** `OSSupport` can be `True`, `False`, or a list like `[ Computer; Console ]`. The current tool uses a dropdown with only `true`/`false` - this is limiting.
6. **NameGenerator Extension:** The tool currently appends `.txt` in some places but not others. The game expects just the filename (no extension) in the TyD, but the file itself must be `.txt`.
7. **Case Sensitivity:** `True`/`False` must be capitalized in TyD.
8. **Hardware Mods:** Require `Hardware True`, `Manufacturing` table, 128x128 PNG thumbnails.

---

## 9. Official Resources

- **Modding Wiki:** https://softwareinc.coredumping.com/wiki/index.php/Modding
- **Data Modding:** https://softwareinc.coredumping.com/wiki/index.php/Data_Modding
- **Name Generators:** https://softwareinc.coredumping.com/wiki/index.php/Data_Modding#Name_generators
- **Translate:** https://translate.coredumping.com
- **In-Game Data Downloads:** Alpha/Beta data zips available on wiki for reference.

---

*Document generated for Software Inc Mod Creator project improvement planning.*
