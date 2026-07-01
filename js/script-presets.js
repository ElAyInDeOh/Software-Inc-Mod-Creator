/**
 * ScriptPresets - SIPL script templates for Level 3 SubFeatures
 *
 * Software Inc. Level 3 features use SIPL (Software Inc Programming Language)
 * scripts attached via `Script_<EntryPoint>` records. This module exposes the
 * 5 valid entry points documented on the Data Modding wiki and ~10 commonly
 * requested starting-point scripts that users can drop in and edit.
 *
 * Reference: https://softwareinc.coredumping.com/wiki/index.php/Data_Modding#Level_3_features
 *            https://softwareinc.coredumping.com/wiki/index.php/SIPL
 */

const ScriptPresets = (function () {
  'use strict';

  // Valid SIPL script entry points for Level 3 features.
  // Keyed without the "Script_" prefix; the prefix is added when serializing.
  const ENTRY_POINTS = [
    {
      key: 'EndOfDay',
      field: 'Script_EndOfDay',
      scope: 'ProductScope',
      runTypeValid: true,
      desc: 'Runs every day after release, after the market has finished simulating sales.'
    },
    {
      key: 'AfterSales',
      field: 'Script_AfterSales',
      scope: 'SaleScope',
      runTypeValid: false,
      desc: 'Runs right after daily sales units are calculated. PhysicalSales, DigitalSales and Refunds are editable here.'
    },
    {
      key: 'OnRelease',
      field: 'Script_OnRelease',
      scope: 'ProductScope',
      runTypeValid: true,
      desc: 'Runs once when the product is created, before it is registered in the market.'
    },
    {
      key: 'NewCopies',
      field: 'Script_NewCopies',
      scope: 'CopyScope',
      runTypeValid: true,
      desc: 'Runs when new physical copies are shipped. NewCopies is read-only.'
    },
    {
      key: 'WorkItemChange',
      field: 'Script_WorkItemChange',
      scope: 'DevScope',
      runTypeValid: false,
      desc: 'Runs when any work item related to this product is created or stopped. Use the "is" keyword to check types (e.g. WorkItem is MarketingPlan).'
    }
  ];

  // RunType is only meaningful for EndOfDay, OnRelease, and NewCopies.
  const RUN_TYPES = ['Local', 'Host', 'Everyone'];

  // 10 commonly-requested Level 3 script starting points.
  // All scripts are valid SIPL and safe to ship as-is or as editable templates.
  // Patterns deliberately avoid &&, ||, ! to stay within verified SIPL syntax —
  // use chained comparisons (e.g. `0 < x < 10`) or nested if/else instead.
  const PRESET_SCRIPTS = [
    {
      id: 'daily_upkeep',
      name: 'Daily upkeep cost',
      entryPoint: 'EndOfDay',
      description: 'Charge the developing company a fixed amount every day the product is on the market.',
      script:
        '// Owner pays $1000 per day while product is active\n' +
        'Product.DevCompany.MakeTransaction(-1000, Bills, "Daily upkeep");'
    },
    {
      id: 'self_healing_bugs',
      name: 'Self-healing bugs',
      entryPoint: 'EndOfDay',
      description: 'Slowly remove bugs proportional to the active user base — simulates community patches.',
      script:
        '// Squash a fraction of bugs daily, scaled by user base\n' +
        'var healed = Product.Userbase * 0.001;\n' +
        'Product.Bugs = Max(0, Product.Bugs - healed);'
    },
    {
      id: 'codrot',
      name: 'Codrot over time',
      entryPoint: 'EndOfDay',
      description: 'Bugs accumulate slowly based on how many users actively run the product.',
      script:
        '// Add ~1 bug per 100k daily users to simulate rotting code\n' +
        'Product.Bugs = Product.Bugs + (Product.Userbase / 100000);'
    },
    {
      id: 'random_audit',
      name: 'Random audit / lawsuit',
      entryPoint: 'EndOfDay',
      description: 'Small random chance each day of an audit-style lawsuit if the product is widely used.',
      script:
        '// Roll the dice based on popularity and user base\n' +
        'var trigger = Random() * Product.Userbase;\n' +
        'if (trigger > 1000000 * Product.Category.Popularity) {\n' +
        '  LaunchLawsuit("AuditTriggered", Product.Sum * 0.05, 0.7);\n' +
        '  AddPopUp("Audit triggered for " + Product.Name, 0.6, "Exclamation", "Warning");\n' +
        '}'
    },
    {
      id: 'fan_penalty_buggy',
      name: 'Fan penalty for buggy product',
      entryPoint: 'EndOfDay',
      description: 'Lose a handful of fans every day while the product has more than 50 bugs.',
      script:
        'if (Product.Bugs > 50) {\n' +
        '  Product.DevCompany.AddFans(-10, Product.Category);\n' +
        '}'
    },
    {
      id: 'release_marketing_burst',
      name: 'Release-day marketing burst',
      entryPoint: 'OnRelease',
      description: 'Add a one-time awareness boost the moment the product launches.',
      script:
        '// Boost awareness on launch day\n' +
        'Product.Awareness = Product.Awareness + 0.5;\n' +
        'AddPopUp("Big launch marketing for " + Product.Name, 0.6, "Money", "Good");'
    },
    {
      id: 'release_fee',
      name: 'One-time launch fee',
      entryPoint: 'OnRelease',
      description: 'Charge the developer a single large fee on release day (e.g., marketing spend).',
      script:
        '// $50k launch spend, recorded under Marketing\n' +
        'Product.DevCompany.MakeTransaction(-50000, Marketing, "Launch campaign");'
    },
    {
      id: 'per_sale_royalty',
      name: 'Per-sale royalty',
      entryPoint: 'AfterSales',
      description: 'Pay the developer a per-unit cost (or royalty) for every digital copy sold that day.',
      script:
        '// $0.50 royalty paid out per digital sale today\n' +
        'var royalty = DigitalSales * 0.5;\n' +
        'if (royalty > 0) {\n' +
        '  Product.DevCompany.MakeTransaction(-royalty, Bills, "Per-sale royalty");\n' +
        '}'
    },
    {
      id: 'stockpile_warning',
      name: 'Physical stockpile warning',
      entryPoint: 'NewCopies',
      description: 'Warn the player once if a physical product is accumulating too much unsold stock.',
      script:
        '// Fire a popup the first time inventory piles up past 100k\n' +
        'if (Product.GetVar("StockWarned", false)) {\n' +
        '  // already warned\n' +
        '} else {\n' +
        '  if (NewCopies > 100000) {\n' +
        '    AddPopUp("Inventory is piling up for " + Product.Name, 0.5, "Exclamation", "Warning");\n' +
        '    Product.PutVar("StockWarned", true);\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'task_tracker',
      name: 'Track marketing & dev tasks',
      entryPoint: 'WorkItemChange',
      description: 'Log whenever a marketing plan related to the product starts or stops.',
      script:
        'if (WorkItem is MarketingPlan) {\n' +
        '  if (Ended) {\n' +
        '    Debug("Marketing plan ended for " + Product.Name);\n' +
        '  } else {\n' +
        '    if (Cancelled) {\n' +
        '      Debug("Marketing plan cancelled for " + Product.Name);\n' +
        '    } else {\n' +
        '      Debug("Marketing plan started for " + Product.Name);\n' +
        '    }\n' +
        '  }\n' +
        '}'
    },

    // ─── Player-help presets: money, fans, bugs, sales bonuses ───
    // These effects benefit the developing company/player rather than punishing them.
    {
      id: 'passive_income',
      name: 'Passive daily income',
      entryPoint: 'EndOfDay',
      description: 'Generate passive income each day proportional to the active user base.',
      script:
        '// Daily passive income scaled by active users ($0.01 per user)\n' +
        'var income = Product.Userbase * 0.01;\n' +
        'if (income > 0) {\n' +
        '  Product.DevCompany.MakeTransaction(income, Sales, "Passive income from " + Product.Name);\n' +
        '}'
    },
    {
      id: 'stable_quality_fans',
      name: 'Fans for stable quality',
      entryPoint: 'EndOfDay',
      description: 'Reward low-bug products with steady daily fan growth in the product\'s category.',
      script:
        '// Products with fewer than 10 bugs gain fans daily\n' +
        'if (Product.Bugs < 10) {\n' +
        '  Product.DevCompany.AddFans(5, Product.Category);\n' +
        '}'
    },
    {
      id: 'community_patch_cycle',
      name: 'Periodic community patch',
      entryPoint: 'EndOfDay',
      description: 'Every 30 days a community patch ships, healing extra bugs scaled by user base.',
      script:
        '// Accumulate days, ship a bigger patch every 30 days\n' +
        'var count = Product.GetVar("PatchCycle", 0);\n' +
        'count = count + 1;\n' +
        'Product.PutVar("PatchCycle", count);\n' +
        'if (count >= 30) {\n' +
        '  Product.Bugs = Max(0, Product.Bugs - Product.Userbase * 0.005);\n' +
        '  Product.PutVar("PatchCycle", 0);\n' +
        '  AddPopUp("Community patch shipped for " + Product.Name, 0.5, "Info", "Good");\n' +
        '}'
    },
    {
      id: 'launch_extravaganza',
      name: 'Launch day extravaganza',
      entryPoint: 'OnRelease',
      description: 'One-time boost to awareness and fans the moment the product ships.',
      script:
        '// Big launch marketing: max awareness + 1000 fans in category\n' +
        'Product.Awareness = Product.Awareness + 1.0;\n' +
        'Product.DevCompany.AddFans(1000, Product.Category);\n' +
        'AddPopUp("Launch extravaganza for " + Product.Name + "!", 0.7, "Money", "Good");'
    },
    {
      id: 'viral_sales_boost',
      name: 'Viral sales boost',
      entryPoint: 'AfterSales',
      description: 'When daily digital sales cross 1000, a viral moment adds 10% more copies sold.',
      script:
        '// Viral moment: bonus sales once the daily threshold is reached\n' +
        'if (DigitalSales > 1000) {\n' +
        '  DigitalSales = DigitalSales + Floor(DigitalSales * 0.1);\n' +
        '}'
    },
    {
      id: 'loyal_user_fans',
      name: 'Loyal users become fans',
      entryPoint: 'EndOfDay',
      description: 'Convert a tiny fraction of active users into fans each day — slow loyal growth.',
      script:
        '// Loyal users recommend the product over time\n' +
        'var newFans = Product.Userbase * 0.0001;\n' +
        'if (newFans > 1) {\n' +
        '  Product.DevCompany.AddFans(Round(newFans), Product.Category);\n' +
        '}'
    },
    {
      id: 'quality_premium',
      name: 'Quality premium per sale',
      entryPoint: 'AfterSales',
      description: 'Pay a $2 bonus per digital sale when the product has fewer than 5 bugs.',
      script:
        '// Premium-quality bonus per sale when bugs are very low\n' +
        'if (Product.Bugs < 5) {\n' +
        '  var bonus = DigitalSales * 2;\n' +
        '  if (bonus > 0) {\n' +
        '    Product.DevCompany.MakeTransaction(bonus, Sales, "Quality premium for " + Product.Name);\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'community_qa',
      name: 'Community QA scales with growth',
      entryPoint: 'EndOfDay',
      description: 'Faster-growing user bases file more bug reports — and squash more bugs in response.',
      script:
        '// Track last user base, heal bugs proportional to growth\n' +
        'var lastBase = Product.GetVar("LastBase", Product.Userbase);\n' +
        'var growth = Product.Userbase - lastBase;\n' +
        'if (growth > 0) {\n' +
        '  Product.Bugs = Max(0, Product.Bugs - growth * 0.01);\n' +
        '}\n' +
        'Product.PutVar("LastBase", Product.Userbase);'
    },
    {
      id: 'bug_free_subsidy',
      name: 'Bug-free subsidy',
      entryPoint: 'EndOfDay',
      description: 'Daily $500 bonus refund while the product has fewer than 1 bug reported.',
      script:
        '// Government-style subsidy for near-perfect quality\n' +
        'if (Product.Bugs < 1) {\n' +
        '  Product.DevCompany.MakeTransaction(500, Sales, "Bug-free subsidy for " + Product.Name);\n' +
        '}'
    },
    {
      id: 'user_milestone_bonus',
      name: 'User milestone bonus fans',
      entryPoint: 'EndOfDay',
      description: 'One-time fan bonus + popup the first time the product crosses 100k active users.',
      script:
        '// Fire a one-time bonus at the 100k users milestone\n' +
        'var milestone = Product.GetVar("UserMilestone", 0);\n' +
        'if (Product.Userbase > 100000) {\n' +
        '  if (milestone < 100000) {\n' +
        '    Product.DevCompany.AddFans(500, Product.Category);\n' +
        '    AddPopUp(Product.Name + " reached 100k users!", 0.7, "Exclamation", "Good");\n' +
        '    Product.PutVar("UserMilestone", 100000);\n' +
        '  }\n' +
        '}'
    },

    // ─── Economy: money in/out, taxes, costs, market forces ───
    {
      id: 'progressive_income_tax',
      name: 'Progressive income tax',
      entryPoint: 'EndOfDay',
      description: 'Daily income is taxed progressively: 10% under $10k/day, 25% above. Higher earnings pay a higher rate.',
      script:
        '// Progressive tax brackets on daily income\n' +
        'var income = Product.Userbase * 0.05;\n' +
        'var tax = 0;\n' +
        'if (income < 10000) {\n' +
        '  tax = income * 0.1;\n' +
        '} else {\n' +
        '  tax = 1000 + (income - 10000) * 0.25;\n' +
        '}\n' +
        'if (tax > 0) {\n' +
        '  Product.DevCompany.MakeTransaction(-tax, Bills, "Progressive income tax");\n' +
        '}'
    },
    {
      id: 'server_bandwidth_cost',
      name: 'Bandwidth cost (quadratic)',
      entryPoint: 'EndOfDay',
      description: 'Server/bandwidth costs scale quadratically with userbase — bigger products get exponentially costlier to run.',
      script:
        '// Quadratic bandwidth cost: large userbases cost disproportionately more\n' +
        'var users = Product.Userbase;\n' +
        'var cost = (users * users) / 50000000;\n' +
        'if (cost > 0) {\n' +
        '  Product.DevCompany.MakeTransaction(-cost, Bills, "Bandwidth scaling cost");\n' +
        '}'
    },
    {
      id: 'subscription_churn',
      name: 'Subscription + churn on bugs',
      entryPoint: 'EndOfDay',
      description: 'Steady subscription income, but users churn (lose 5%) when bugs exceed 30 — quality drives retention.',
      script:
        '// Subscription revenue, but buggy products bleed users\n' +
        'var subs = Product.Userbase * 0.02;\n' +
        'Product.DevCompany.MakeTransaction(subs, Sales, "Subscription revenue");\n' +
        'if (Product.Bugs > 30) {\n' +
        '  Product.Userbase = Product.Userbase * 0.95;\n' +
        '  AddPopUp("Subscriptions churning from " + Product.Name + " (bugs)", 0.6, "Exclamation", "Warning");\n' +
        '}'
    },
    {
      id: 'refund_wave_buggy',
      name: 'Refund wave on high bugs',
      entryPoint: 'AfterSales',
      description: 'When bugs exceed 25, a wave of refund requests hits — 30% of digital sales become refunds that day.',
      script:
        '// Buggy product triggers mass refund wave today\n' +
        'if (Product.Bugs > 25) {\n' +
        '  Refunds = Refunds + Floor(DigitalSales * 0.3);\n' +
        '  AddPopUp("Refund wave for " + Product.Name, 0.5, "Exclamation", "Warning");\n' +
        '}'
    },
    {
      id: 'rainy_day_fund',
      name: 'Rainy day fund',
      entryPoint: 'EndOfDay',
      description: 'Saves 5% of daily income into a fund; auto-withdraws the balance to pay the company when bugs spike above 40.',
      script:
        '// Save income, auto-release when bugs spike\n' +
        'var saved = Product.GetVar("RainyFund", 0);\n' +
        'var dailyIncome = Product.Userbase * 0.01;\n' +
        'saved = saved + (dailyIncome * 0.05);\n' +
        'Product.PutVar("RainyFund", saved);\n' +
        'if (Product.Bugs > 40) {\n' +
        '  if (saved > 0) {\n' +
        '    Product.DevCompany.MakeTransaction(saved, Sales, "Rainy day fund withdrawal");\n' +
        '    Product.PutVar("RainyFund", 0);\n' +
        '    AddPopUp("Rainy day fund used for " + Product.Name, 0.6, "Money", "Good");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'market_crash_vulnerable',
      name: 'Random market crash',
      entryPoint: 'EndOfDay',
      description: '2% daily chance of a market crash that costs the company a slice of income tied to userbase size.',
      script:
        '// Small chance of a market crash hitting income\n' +
        'if (Random() < 0.02) {\n' +
        '  var loss = Product.Userbase * 0.05;\n' +
        '  Product.DevCompany.MakeTransaction(-loss, Bills, "Market crash impact");\n' +
        '  AddPopUp("Market crash affects " + Product.Name, 0.7, "Exclamation", "Warning");\n' +
        '}'
    },
    {
      id: 'monopoly_bonus',
      name: 'Monopoly premium bonus',
      entryPoint: 'EndOfDay',
      description: 'Once the product has 500k+ active users, a monopoly premium multiplies daily income.',
      script:
        '// At 500k users, monopoly multiplier kicks in\n' +
        'if (Product.Userbase > 500000) {\n' +
        '  var bonus = Product.Userbase * 0.003;\n' +
        '  Product.DevCompany.MakeTransaction(bonus, Sales, "Monopoly premium");\n' +
        '}'
    },
    {
      id: 'inflation_erosion',
      name: 'Planned obsolescence',
      entryPoint: 'EndOfDay',
      description: 'After 180 days on the market, the product starts slowly losing users each day — simulates aging out of relevance.',
      script:
        '// Old products slowly lose relevance after 6 months\n' +
        'var age = Product.GetVar("ProdAge", 0);\n' +
        'age = age + 1;\n' +
        'Product.PutVar("ProdAge", age);\n' +
        'if (age > 180) {\n' +
        '  var decay = (age - 180) * 0.0001 * Product.Userbase;\n' +
        '  Product.Userbase = Product.Userbase - decay;\n' +
        '}'
    },

    // ─── Fans & reputation ───
    {
      id: 'viral_milestone_1m',
      name: 'Viral 1 million user celebration',
      entryPoint: 'EndOfDay',
      description: 'One-time huge fan boost + popup the first time the product crosses 1 million active users.',
      script:
        '// One-time celebration at 1M users\n' +
        'var milestone = Product.GetVar("MillionMilestone", 0);\n' +
        'if (Product.Userbase > 1000000) {\n' +
        '  if (milestone < 1000000) {\n' +
        '    Product.DevCompany.AddFans(5000, Product.Category);\n' +
        '    AddPopUp(Product.Name + " reached 1M users!", 0.8, "Exclamation", "Good");\n' +
        '    Product.PutVar("MillionMilestone", 1000000);\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'controversy_backfire',
      name: 'Controversy: lose fans when buggy',
      entryPoint: 'EndOfDay',
      description: 'High bugs (40+) combined with large userbase (>50k) cause daily fan loss — scandals spread faster when popular.',
      script:
        '// Scandals scale with popularity\n' +
        'if (Product.Bugs > 40) {\n' +
        '  if (Product.Userbase > 50000) {\n' +
        '    var loss = Product.Userbase * 0.0002;\n' +
        '    Product.DevCompany.AddFans(-loss, Product.Category);\n' +
        '    AddPopUp("Controversy brewing over " + Product.Name, 0.7, "Exclamation", "Warning");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'cult_following',
      name: 'Cult following (small base)',
      entryPoint: 'EndOfDay',
      description: 'Products with under 1000 users gain fans faster — small but loyal communities generate buzz.',
      script:
        '// Small userbase gains fans (cult classic effect)\n' +
        'if (Product.Userbase < 1000) {\n' +
        '  if (Product.Userbase > 10) {\n' +
        '    Product.DevCompany.AddFans(2, Product.Category);\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'negative_review_bomb',
      name: 'Random review bomb',
      entryPoint: 'EndOfDay',
      description: '5% daily chance of a review bomb hitting the product if bugs exceed 20 — loses 500 fans per event.',
      script:
        '// Random chance of a review bomb while product is buggy\n' +
        'if (Product.Bugs > 20) {\n' +
        '  if (Random() < 0.05) {\n' +
        '    Product.DevCompany.AddFans(-500, Product.Category);\n' +
        '    AddPopUp("Review bomb hits " + Product.Name, 0.7, "Exclamation", "Warning");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'charity_drive',
      name: 'Annual charity drive',
      entryPoint: 'EndOfDay',
      description: 'Once per year, the company donates $5000 in exchange for a +1000 fan boost — money for reputation.',
      script:
        '// Annual charity event: spend money for fans\n' +
        'var cycle = Product.GetVar("CharityCycle", 0);\n' +
        'cycle = cycle + 1;\n' +
        'Product.PutVar("CharityCycle", cycle);\n' +
        'if (cycle >= 365) {\n' +
        '  Product.DevCompany.MakeTransaction(-5000, Bills, "Annual charity drive");\n' +
        '  Product.DevCompany.AddFans(1000, Product.Category);\n' +
        '  AddPopUp("Charity drive boosts reputation for " + Product.Name, 0.6, "Money", "Good");\n' +
        '  Product.PutVar("CharityCycle", 0);\n' +
        '}'
    },
    {
      id: 'influencer_endorsement',
      name: 'Random influencer endorsement',
      entryPoint: 'EndOfDay',
      description: '1% daily chance of a surprise influencer endorsement: +0.3 awareness and +300 fans.',
      script:
        '// Small chance of an influencer endorsement\n' +
        'if (Random() < 0.01) {\n' +
        '  Product.Awareness = Product.Awareness + 0.3;\n' +
        '  Product.DevCompany.AddFans(300, Product.Category);\n' +
        '  AddPopUp("Influencer endorses " + Product.Name + "!", 0.7, "Money", "Good");\n' +
        '}'
    },
    {
      id: 'bad_press_cascade',
      name: 'Bad press cascade',
      entryPoint: 'EndOfDay',
      description: 'While bugs exceed 30, awareness drops 2% daily — negative coverage spreads and starves your marketing.',
      script:
        '// Awareness erodes while product is buggy\n' +
        'if (Product.Bugs > 30) {\n' +
        '  Product.Awareness = Product.Awareness - 0.02;\n' +
        '}'
    },

    // ─── Bugs & stability ───
    {
      id: 'bug_avalanche',
      name: 'Bug avalanche (doom loop)',
      entryPoint: 'EndOfDay',
      description: 'Bugs compound daily: more bugs = faster bug growth. A punishing spiral if quality is neglected.',
      script:
        '// Bugs breed bugs — compounding doom loop\n' +
        'Product.Bugs = Product.Bugs + (Product.Bugs * 0.001);'
    },
    {
      id: 'emergency_hotfix',
      name: 'Emergency hotfix (one-time)',
      entryPoint: 'EndOfDay',
      description: 'The first day bugs exceed 30, automatically deploys a $10k emergency hotfix that wipes 90% of bugs.',
      script:
        '// One-time emergency: nuke bugs for a fee\n' +
        'var hotfixed = Product.GetVar("Hotfixed", false);\n' +
        'if (hotfixed) {\n' +
        '  // already used\n' +
        '} else {\n' +
        '  if (Product.Bugs > 30) {\n' +
        '    Product.Bugs = Product.Bugs * 0.1;\n' +
        '    Product.DevCompany.MakeTransaction(-10000, Bills, "Emergency hotfix");\n' +
        '    AddPopUp("Emergency hotfix deployed for " + Product.Name, 0.7, "Info", "Good");\n' +
        '    Product.PutVar("Hotfixed", true);\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'legacy_code',
      name: 'Legacy code erosion',
      entryPoint: 'EndOfDay',
      description: 'Bugs accumulate slightly faster every day the product is alive — technical debt compounds with age.',
      script:
        '// Older products collect bugs faster (tech debt)\n' +
        'var age = Product.GetVar("LegacyAge", 0);\n' +
        'age = age + 1;\n' +
        'Product.PutVar("LegacyAge", age);\n' +
        'var extraRate = age * 0.00001;\n' +
        'Product.Bugs = Product.Bugs + extraRate;'
    },
    {
      id: 'beta_tester_feedback',
      name: 'Beta tester feedback',
      entryPoint: 'EndOfDay',
      description: 'Products with under 1000 users heal 0.5 bugs daily — a small community reports issues faster.',
      script:
        '// Small userbase acts like beta testers\n' +
        'if (Product.Userbase < 1000) {\n' +
        '  Product.Bugs = Max(0, Product.Bugs - 0.5);\n' +
        '}'
    },
    {
      id: 'quality_moat',
      name: 'Quality moat (word of mouth)',
      entryPoint: 'EndOfDay',
      description: 'Products with fewer than 5 bugs gain a tiny daily userbase bump — high quality sells itself.',
      script:
        '// Near-perfect quality grows userbase organically\n' +
        'if (Product.Bugs < 5) {\n' +
        '  var retention = Product.Userbase * 0.0005;\n' +
        '  Product.Userbase = Product.Userbase + retention;\n' +
        '}'
    },

    // ─── Sales & market ───
    {
      id: 'flash_sale',
      name: 'Random flash sale',
      entryPoint: 'AfterSales',
      description: '3% daily chance of a flash sale that doubles digital sales for the day.',
      script:
        '// Random flash sale: double digital sales today\n' +
        'if (Random() < 0.03) {\n' +
        '  DigitalSales = DigitalSales * 2;\n' +
        '  AddPopUp("Flash sale doubles " + Product.Name + " sales today!", 0.6, "Money", "Good");\n' +
        '}'
    },
    {
      id: 'seasonal_sale_spike',
      name: 'Seasonal sale spike',
      entryPoint: 'AfterSales',
      description: 'Every 30 days a seasonal/holiday event boosts digital sales by 20%.',
      script:
        '// Monthly seasonal sales boost\n' +
        'var cycle = Product.GetVar("SeasonCycle", 0);\n' +
        'cycle = cycle + 1;\n' +
        'Product.PutVar("SeasonCycle", cycle);\n' +
        'if (cycle >= 30) {\n' +
        '  DigitalSales = DigitalSales + Floor(DigitalSales * 0.2);\n' +
        '  AddPopUp("Holiday sale spike for " + Product.Name, 0.5, "Money", "Good");\n' +
        '  Product.PutVar("SeasonCycle", 0);\n' +
        '}'
    },
    {
      id: 'refund_fraud_detection',
      name: 'Refund fraud detection',
      entryPoint: 'AfterSales',
      description: 'Cuts daily refunds by 20% — simulates fraud detection catching abusive refund requests.',
      script:
        '// Anti-fraud: trim 20% of refunds daily\n' +
        'Refunds = Refunds * 0.8;'
    },
    {
      id: 'early_adopter_bonus',
      name: 'Early adopter sales bonus',
      entryPoint: 'AfterSales',
      description: 'For the first 30 days after release, digital sales get a 50% bonus — fresh products sell better.',
      script:
        '// First 30 days: 50% sales bonus\n' +
        'var age = Product.GetVar("EarlyAge", 0);\n' +
        'age = age + 1;\n' +
        'Product.PutVar("EarlyAge", age);\n' +
        'if (age < 30) {\n' +
        '  DigitalSales = DigitalSales + Floor(DigitalSales * 0.5);\n' +
        '}'
    },

    // ─── Server, bandwidth & cyber events ───
    {
      id: 'server_overload_outage',
      name: 'Server overload outage',
      entryPoint: 'EndOfDay',
      description: 'If userbase grew more than 10% overnight, 5% chance of an outage that drops 10% of users.',
      script:
        '// Rapid growth risks server overload\n' +
        'var lastBase = Product.GetVar("OLastBase", Product.Userbase);\n' +
        'var growth = Product.Userbase - lastBase;\n' +
        'Product.PutVar("OLastBase", Product.Userbase);\n' +
        'if (growth > Product.Userbase * 0.1) {\n' +
        '  if (Random() < 0.05) {\n' +
        '    Product.Userbase = Product.Userbase * 0.9;\n' +
        '    AddPopUp("Server overload outage for " + Product.Name, 0.7, "Server", "Warning");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'ddos_attack',
      name: 'Random DDoS attack',
      entryPoint: 'EndOfDay',
      description: '1% daily chance of a DDoS attack dropping 5% of active users — bigger products are juicier targets.',
      script:
        '// DDoS drops users when the product is popular\n' +
        'if (Product.Userbase > 10000) {\n' +
        '  if (Random() < 0.01) {\n' +
        '    Product.Userbase = Product.Userbase * 0.95;\n' +
        '    AddPopUp("DDoS attack disrupts " + Product.Name, 0.7, "Server", "Warning");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'security_breach',
      name: 'Security breach event',
      entryPoint: 'EndOfDay',
      description: 'Bug-heavy products (50+) risk a 2%-daily security breach: lose users, $20k settlement, and 2000 fans.',
      script:
        '// Buggy products risk a data breach\n' +
        'if (Product.Bugs > 50) {\n' +
        '  if (Random() < 0.02) {\n' +
        '    var loss = Product.Userbase * 0.1;\n' +
        '    Product.Userbase = Product.Userbase - loss;\n' +
        '    Product.DevCompany.MakeTransaction(-20000, Bills, "Security breach settlement");\n' +
        '    Product.DevCompany.AddFans(-2000, Product.Category);\n' +
        '    AddPopUp("Security breach at " + Product.Name + "!", 0.8, "Exclamation", "Warning");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'antitrust_lawsuit',
      name: 'Antitrust lawsuit risk',
      entryPoint: 'EndOfDay',
      description: 'At extreme dominance (1M+ users), 1% daily chance the government files an antitrust lawsuit.',
      script:
        '// Massive dominance attracts antitrust scrutiny\n' +
        'if (Product.Userbase > 1000000) {\n' +
        '  if (Random() < 0.01) {\n' +
        '    LaunchLawsuit("AntitrustViolation", Product.Sum * 0.2, 0.9);\n' +
        '    AddPopUp("Antitrust lawsuit filed against " + Product.Name, 0.8, "Exclamation", "Warning");\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'product_recall',
      name: 'Product recall (catastrophe)',
      entryPoint: 'EndOfDay',
      description: 'The first day bugs exceed 100 triggers a one-time recall: $50k cost and half the userbase lost.',
      script:
        '// Catastrophic bugs force a one-time recall\n' +
        'var recalled = Product.GetVar("Recalled", false);\n' +
        'if (recalled) {\n' +
        '  // already recalled\n' +
        '} else {\n' +
        '  if (Product.Bugs > 100) {\n' +
        '    Product.DevCompany.MakeTransaction(-50000, Bills, "Product recall");\n' +
        '    Product.Userbase = Product.Userbase * 0.5;\n' +
        '    AddPopUp("Product recall issued for " + Product.Name, 0.8, "Exclamation", "Warning");\n' +
        '    Product.PutVar("Recalled", true);\n' +
        '  }\n' +
        '}'
    },
    {
      id: 'anniversary_celebration',
      name: 'Anniversary celebration',
      entryPoint: 'EndOfDay',
      description: 'Once per year (365 days) the product\'s anniversary grants +2000 fans and a $10k bonus.',
      script:
        '// Yearly anniversary bonus\n' +
        'var anniv = Product.GetVar("AnnivDays", 0);\n' +
        'anniv = anniv + 1;\n' +
        'Product.PutVar("AnnivDays", anniv);\n' +
        'if (anniv >= 365) {\n' +
        '  Product.DevCompany.AddFans(2000, Product.Category);\n' +
        '  Product.DevCompany.MakeTransaction(10000, Sales, "Anniversary bonus");\n' +
        '  AddPopUp(Product.Name + " anniversary celebration!", 0.7, "Money", "Good");\n' +
        '  Product.PutVar("AnnivDays", 0);\n' +
        '}'
    }
  ];
  function listEntryPoints() {
    return ENTRY_POINTS.slice();
  }

  function findEntryPoint(key) {
    return ENTRY_POINTS.find(function (ep) { return ep.key === key; }) || null;
  }

  function listRunTypes() {
    return RUN_TYPES.slice();
  }

  function listScripts(forEntryPoint) {
    if (!forEntryPoint) return PRESET_SCRIPTS.slice();
    return PRESET_SCRIPTS.filter(function (p) { return p.entryPoint === forEntryPoint; });
  }

  function findScript(id) {
    return PRESET_SCRIPTS.find(function (p) { return p.id === id; }) || null;
  }

  return {
    ENTRY_POINTS: ENTRY_POINTS,
    RUN_TYPES: RUN_TYPES,
    listEntryPoints: listEntryPoints,
    findEntryPoint: findEntryPoint,
    listRunTypes: listRunTypes,
    listScripts: listScripts,
    findScript: findScript
  };
})();

if (typeof window !== 'undefined') {
  window.ScriptPresets = ScriptPresets;
}
