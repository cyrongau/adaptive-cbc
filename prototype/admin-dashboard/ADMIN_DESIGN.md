---
name: Academic Noir Dashboard
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#becabd'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#899488'
  outline-variant: '#3f4940'
  surface-tint: '#7eda95'
  primary: '#7eda95'
  on-primary: '#003919'
  primary-container: '#47a263'
  on-primary-container: '#003115'
  inverse-primary: '#006d36'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#009ada'
  on-tertiary-container: '#002d43'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9af7af'
  primary-fixed-dim: '#7eda95'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005227'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Nunito Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Nunito Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-stakes administrative environments where data density and clarity are paramount. It adopts a **Corporate/Modern** aesthetic with a refined, dark-mode bias to reduce eye strain during prolonged use. 

The personality is authoritative, sophisticated, and precise. By utilizing a deep navy-charcoal foundation, the design system minimizes visual noise, allowing the "Academic Green" primary accents to guide the user's attention toward critical actions and status updates. The interface avoids unnecessary decoration, favoring structural integrity and functional hierarchy to evoke a sense of professional mastery over complex datasets.

## Colors

The palette is built upon a hierarchy of depth and importance. The primary background (Canvas) uses a deep **#0f172a**, while elevated surfaces (Cards/Sidebars) use **#1e293b**. This subtle tonal shift provides structure without the need for heavy shadows.

**Academic Green (#2d8a4e)** is reserved strictly for primary calls-to-action, success states, and key navigational indicators. Secondary information utilizes **Slate (#64748b)** to maintain a professional, low-vibrancy environment. Typography is set in high-contrast off-whites to ensure maximum readability against the dark backdrop while avoiding the harshness of pure white.

## Typography

The design system exclusively utilizes **Nunito Sans** to leverage its exceptional legibility and balanced geometric proportions. For an admin context, typography is scaled for high density.

- **Headlines:** Use Bold and ExtraBold weights to establish clear section hierarchy.
- **Body Text:** Primarily uses the 14px (md) size for data grids and descriptions to maximize information per screen.
- **Labels:** Small, uppercase, and slightly tracked-out (letter-spaced) to differentiate them from interactive data points.
- **Numeric Data:** Should utilize tabular lining figures where possible to ensure columns of numbers align perfectly in tables.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the navigation and a **Fluid Content** area. A 12-column grid system is applied to the main workspace. 

- **Sidebar:** Fixed at 260px for desktop to provide a persistent anchor for navigation.
- **Rhythm:** An 8px base grid drives all spacing decisions, with 4px increments used for tight internal component padding (e.g., input field interiors).
- **Density:** Margins between cards and major sections are kept to a strict 24px or 32px on desktop to maintain a professional, "tight" dashboard feel. On mobile, these compress to 16px.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. 

Depth is communicated through brightness:
1. **Level 0 (Canvas):** The darkest layer (#0f172a), used for the application background.
2. **Level 1 (Surface):** Slightly lighter (#1e293b), used for cards, sidebars, and headers.
3. **Level 2 (Interaction):** Lighter still (#334155), used for hover states on list items or buttons.

Borders are critical in this dark theme; use a 1px solid stroke of **#334155** (Slate 700) for all card boundaries and input fields to ensure they remain distinct when they overlap or sit adjacent to each other.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch that prevents the UI from feeling aggressive or "brutalist," while maintaining the professional rigor expected of an academic admin tool. 

- **Primary Components:** (Buttons, Inputs, Small Cards) use a 4px (0.25rem) radius.
- **Large Containers:** (Main dashboard cards) use an 8px (0.5rem) radius.
- **Selection Indicators:** (Active states in nav) use a 4px radius on the leading edge to create a clean, tab-like appearance.

## Components

### Buttons
- **Primary:** Solid #2d8a4e with white text. High-contrast and immediately recognizable.
- **Secondary:** Transparent background with a #334155 border and white text.
- **Ghost:** No border or background; text in Academic Green or Secondary Slate.

### Input Fields
- **Default:** Background #0f172a with a 1px border of #334155. Text is 14px Nunito Sans.
- **Focus State:** Border changes to Academic Green with a subtle 2px outer glow (0.15 opacity green).

### Data Tables
- **Header:** Background #1e293b, uppercase labels in 12px Nunito Sans Bold.
- **Rows:** Alternating "zebra" tints are not required; instead, use a 1px bottom border (#334155) to separate entries. Hover state changes the entire row background to #334155.

### Chips & Badges
- **Status Indicators:** Small, pill-shaped badges with low-opacity backgrounds (e.g., 10% Academic Green background with 100% Green text) for non-disruptive status communication.

### Cards
- Standard containers for data visualizations and lists. Must include a consistent 24px internal padding and a 1px border to define the surface against the canvas.