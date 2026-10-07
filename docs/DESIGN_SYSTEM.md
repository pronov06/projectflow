# Design System

ProjectFlow's UI follows one visual language, derived from the *Flecto* reference: a warm cream canvas, deep forest-teal structural surfaces, mint used sparingly for primary actions and "done" states, flat border-driven surfaces, and a **single font weight**.

## Architecture

```
apps/web/src/styles/tokens.css     ← the ONLY place visual values are defined (Tailwind v4 @theme)
        │  primitives:  --color-forest-ink, --color-mint-pulse, --spacing-16, --radius-card …
        │  semantic:    --color-canvas, --color-panel, --color-ink, --color-accent, --color-danger …
        ▼
Tailwind utilities generated from those tokens only (bg-panel, text-ink-muted, p-16, rounded-card)
        ▼
UI primitives  components/ui/*  (Button, Field, Modal, Badges, States, Spinner)
        ▼
Features & pages   (compose primitives; no raw visual values)

apps/mobile/src/theme.ts           ← mirror of the same tokens for React Native
```

**Strictness is enforced, not just recommended:**

1. `tokens.css` resets Tailwind's defaults (`--color-*: initial`, `--spacing-*: initial`, `--radius-*: initial`, …). Classes like `bg-slate-100`, `p-3`, `rounded-lg`, `font-bold` or `shadow-md` generate **no CSS**.
2. `npm run lint -w @pms/web` runs [`apps/web/scripts/check-tokens.mjs`](../apps/web/scripts/check-tokens.mjs). It **fails** on:
   - arbitrary values (`w-[37px]`)
   - hard-coded colours (`#…`, `rgb()`)
   - default palettes
   - non-token type, radius, shadow and weight utilities
   - off-scale spacing
   - inline styles

   The only allowed inline styles are data-driven `width: ${n}%` and CSS custom properties.

## Tokens

### Colour

| Primitive | Value | Semantic alias | Use |
|---|---|---|---|
| Forest Ink | `#004737` | `panel`, `ink-brand`, `focus` | Structural surfaces (sidebar, hero panels), headings, focus rings |
| Mint Pulse | `#56f09f` | `accent` | Filled primary button, active nav pill, illustration. Small areas only. |
| Mint Mist | `#d4ffe8` | `accent-soft`, `surface-tint` | Soft pills, "completed" badges, focus halo |
| Cream Canvas | `#fffbec` | `canvas`, `on-panel` | Page background (never pure white); text on forest |
| Deep Loam | `#032019` | `ink`, `on-accent` | Body text |
| Sage Whisper | `#99b5af` | `on-panel-muted`, `line-strong` | Muted text on forest, stronger hairlines |
| Stone Mist | `#ccdad7` | `line` | Hairlines and input borders |
| Bone | `#faf2d5` | `surface-warm` | Warm card lift, hover state |
| Paper | `#ffffff` | `surface` | Cards and inputs **on** the cream canvas |
| *Moss* (extension) | `#48655e` | `ink-muted` | Secondary text on cream. Sage is only ~2:1 there, which fails WCAG AA. |
| *Clay / Clay Mist* (extension) | `#a83a22` / `#fbe4da` | `danger`, `danger-soft` | Errors, destructive actions, high priority, overdue |
| *Amber / Amber Mist* (extension) | `#8a5a00` / `#fff1c7` | `warning`, `warning-soft` | Offline banner |

The reference palette has no error colour, so the extensions are additions for functional states. They're tuned to the same warm, earthy family.

### Typography

There is one family, **Geist 400**: a free stand-in for the reference's Aeonik, loaded from Google Fonts. **There is one weight.** Hierarchy comes from size and negative tracking. Tabular numerals are on globally.

| Token | Size / line-height / tracking | Use |
|---|---|---|
| `text-caption` | 10 / 1.4 / +0.02em | Micro labels (illustration) |
| `text-label` | 12 / 1.4 / +0.02em | Field labels, badges, meta |
| `text-body` | 14 / 1.45 / 0 | Default UI text |
| `text-body-lg` | 16 / 1.5 / 0 | Task names, subtitles |
| `text-subheading` | 20 / 1.3 / −0.01em | Card and section titles, wordmark |
| `text-heading-sm` | 28 / 1.2 / −0.02em | Form titles, mobile page titles |
| `text-heading` | 36 / 1.15 / −0.03em | Page titles, stat numerals |
| `text-heading-lg` | 56 / 1.05 / −0.043em | Auth display headline |

### Spacing, radius, elevation, motion

- **Spacing:** each key **equals its pixel value** (`p-16` = 16px). The scale is 0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 120, 160, plus the named layout dimensions `sidebar`, `topbar` and `notch`.
- **Containers:** `form` 400, `dialog` 560, `prose` 640, `page` 1200.
- **Radius:**

  | Token | Value | Used for |
  |---|---|---|
  | `icon` | 6 | Icon squares |
  | `chip` | 10 | Inputs |
  | `card` | 19 | Cards and dialogs |
  | `panel` | 28 | Forest panels and the notched hero |
  | `button` | 40 | Every button |
  | `pill` | 9999 | Badges and avatars |

- **Elevation:** one token, `shadow-subtle` (`0 3px 2px rgb(0 0 0 / 4%)`). Structure comes from borders.
- **Motion:**
  - `ease-out` / `ease-in-out` curves, 180ms default transitions
  - `animate-rise-in` and `animate-fade-in` entrances
  - All motion collapses under `prefers-reduced-motion`

## Components

| Component | Rules |
|---|---|
| **Button** (`buttonClasses()` is shared with links) | Every button is `rounded-button`. The variants are:<br>• `primary`: mint fill, the one main action per view<br>• `brand`: solid forest<br>• `secondary`: outlined<br>• `soft`: mint-mist pill<br>• `quiet`: text/icon<br>• `danger`<br>• `inverse`: outlined, for forest panels |
| **Field** | Paper fill, stone hairline, `rounded-chip`, forest border plus a mint-mist halo on focus, clay on error. Labels sit above the input in `text-label`. |
| **Badges** | Pills.<br>• Status: forest = in progress, mint-mist = completed, bone = pending, outline = not started. A separate on-panel set is used inside forest heroes.<br>• Priority: label plus 1–3 bars, so it never relies on colour alone. |
| **Cards** | Paper on cream, `border-line`, `rounded-card`. Hover lifts to `surface-warm` (no shadow). |
| **App shell** | A floating forest sidebar (`rounded-panel`, 12px gutter) with a mint active pill. The project page hero repeats the forest-panel motif. |

## Auth screens: the notched panel

The login and register pages reproduce the reference's signature layout and motion. The code is in [`apps/web/src/features/auth/`](../apps/web/src/features/auth) and the `.notched*` / `.flow-*` classes in `index.css`.

- **Notched panel:** a forest panel with a raised centre tab for the headline and a lowered tab for the caption. The cream "shoulders" beside each tab hold the nav, a pause control and the step indicator. The concave joins are hard-stop radial masks driven by `--radius-panel`. Below `lg`, it collapses to a stacked layout.
- **Flow diagram:** mint blocks and thick connectors grow step by step (scale from their origin, staggered by `data-delay`), showing Workspace → Projects → Tasks → Dashboard. The bottom caption crossfades in sync, and the active step segment fills over the step's duration.
- **Accessibility:**
  - The animation pauses when the tab is hidden and can be paused by the user (WCAG 2.2.2).
  - It renders static under `prefers-reduced-motion`.
  - The diagram is `aria-hidden`, with a text alternative.
