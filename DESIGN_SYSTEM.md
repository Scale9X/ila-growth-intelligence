# Scale9X Design System

> **UPDATED 2026-07-05 — now "The Growth Instrument," matching scale9x.com.**
> The diagnostic identity was migrated from the old Navy & Copper enterprise look to the website's **board-paper** system so website → diagnostic feels like ONE product. Source of truth = the website's `gi.css`.
> **Palette:** paper `#F5F2EB` (bg) · ink `#232420` (headings/dark panels) · ink-soft `#5E5D54` · slate `#8F8C82` · **bronze `#A96C2E` = accent only** (was copper) · line `#E4DFD3`. Status green/amber/red unchanged.
> **Type (3 roles):** SERIF **Newsreader** for headlines + marquee figures · SANS **Inter** for body · MONO **IBM Plex Mono** for labels/eyebrows/refs. (Was Inter-only.)
> **Geometry:** near-flat board-paper — `--radius` 4px, hairline shadows, flat ink dark-panels (no navy gradient). Bronze stays a small, deliberate accent.
> The token NAMES below are preserved (`--navy`,`--copper`,`--cream`) but their VALUES are remapped to the above. The legacy Navy & Copper description that follows is historical.

One coherent system for every screen. Analytical, executive, board-document — calm, evidence-first, lots of whitespace. **Never** AI-startup, marketing-agency, crypto, neon, glassmorphism, or oversized illustration.

All values live as CSS variables in `public/client/styles.css` (`:root`) and are mirrored in the marketing homepage `public/index.html`. **Always use the tokens — never hardcode a hex.**

## Color

**Brand (identity):**
| Token | Hex | Use |
|---|---|---|
| `--navy` / `--ink` | `#001F3F` | Headings, dark panels, primary surfaces |
| `--charcoal` | `#2C3E50` | Secondary dark, panel gradient end |
| `--copper` / `--accent` | `#B87333` | **Accent only** — primary CTA, active nav, key metrics, chart accents, important highlights |
| `--copper-light` | `#D4A574` | Metric values on dark surfaces |
| `--cream` / `--bg` | `#F8F4EF` | Page background (app) |
| `--slate` / `--muted` | `#64748B` | Body text, captions, labels |
| `--line` | `#E6DDD0` | Hairline borders/dividers |

**Semantic status (muted, data clarity — NOT decoration):**
| Token | Hex | Meaning |
|---|---|---|
| `--green` | `#3E7C5A` | Success / strength / done / quick-win |
| `--amber` | `#92670F` | Warning / medium / long-term |
| `--red` | `#B0473E` | Critical / high-severity / weakness |

Each has a `-soft` background variant. **Brand identity never overrides status legibility** — an executive must read status instantly.

**Gradients:** `--grad` = Navy→Charcoal (subtle depth on dark panels, *no copper*). `--grad-brand` = Navy→Copper — **logo mark only**. Avoid heavy/large gradients elsewhere.

## Elevation (depth via layers, not color)
- **L1** Warm Cream page (`--bg`)
- **L2** White cards (`--card`) + `--shadow` (subtle)
- **L3** Navy panels (`--grad`) for hero/report cover/feature moments
- **L4** Copper accents — sparing

Shadows are restrained: `--shadow` (hairline), `--shadow-md`, `--shadow-lg` (max). Never heavier.

## Type
Inter only (no serifs). Headings `--ink` navy, weight 700–800, tight tracking. Body `--muted` slate. Accent words / key numbers in `--copper`. Let **whitespace + type weight + alignment** carry hierarchy — not decoration.

## Radii
`--radius:12px` (cards) · `--radius-sm:9px` (buttons, inputs, chips) · `--radius-lg:16px` (large panels). Tight/enterprise — never pill-shaped primary CTAs.

## Components (canonical classes — reuse, don't reinvent)
- **Buttons:** `.btn` (flat copper primary, 9px), `.btn.ghost` (navy text, hairline border), `.btn.lg`, `.btn.sm`.
- **Cards:** `.card` (white, hairline, subtle shadow); `.card.tint`, `.card.feature` (copper top-rule).
- **KPI / metric:** `.stat`, `.scorehead .big`, `.donut`, `.kpiq2` — values in copper.
- **Tables:** `.rtable` (hairline rows).
- **Charts:** `.scorebars` / `.sb-track>i` (band-colored: green ≥75% · amber 50–74% · red <50%), `.donut`, radar — copper line accents.
- **Alerts / status:** `.sev.{high,medium,low}`, `.prio.*`, `.pill.{green,amber,red,accent}`, `.tag.*` — semantic soft bg + text.
- **Forms:** `.field`, `.input`/`.ta`/`.sel` (copper focus ring).
- **Nav:** `.rail` + `.navitem` (active = copper-soft bg + copper text).
- **Report:** `.report`, `.rcover` (navy cover), `.finding`, `.execrow`, `.callout` — minimal, print-friendly, board-document feel.

## Reports
Diagnostic reports = documents for a Board of Directors. Minimal, professional, print-friendly. Navy cover, white body, hairline rules, semantic status only where it aids reading. No colorful/decorative report design.

## Do / Don't
✅ Copper like a luxury watch — small, deliberate, premium.
✅ Calm, analytical, lots of whitespace, consistent spacing.
❌ Large copper fills, heavy gradients, bright orange, neon, glassmorphism, emoji in pro UI, stock-photo aesthetics.
