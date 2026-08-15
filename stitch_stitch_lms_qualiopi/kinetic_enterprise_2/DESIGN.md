---
name: Kinetic Enterprise
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#8691a7'
  on-tertiary-container: '#1f2a3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system embodies a high-performance, technical aesthetic tailored for enterprise-grade applications. It merges **Minimalism** with **Corporate Modern** sensibilities, emphasizing clarity, data density, and professional reliability. 

The brand personality is authoritative yet frictionless. It utilizes a sophisticated "Deep Tech" atmosphere, characterized by precision-engineered layouts and a refined use of depth. The introduction of the dark mode transition shifts the emotional response from "Open and Systematic" in light mode to "Focused and Command-Center" in dark mode. The UI should feel like a high-end developer tool or a financial terminal—robust, responsive, and meticulously organized.

## Colors
This design system utilizes a semantic color architecture to facilitate seamless theme switching. The primary brand color is a vibrant Indigo, which shifts in luminance between modes: a deeper `#6366F1` for light backgrounds and a more luminous `#818CF8` for dark surfaces to maintain AA accessibility standards.

Dark mode is built upon a foundation of deep indigo-tinted grays and rich blacks (Slate and Zinc scales). This ensures the UI feels "ink-like" rather than pure charcoal, maintaining brand cohesion even in low-light environments. Surfaces are layered using tonal shifts rather than shadows alone, moving from `background` (`#020617`) to `surface-elevated` (`#1E293B`).

## Typography
The typographic system relies on a functional hierarchy designed for high-density information displays. **Hanken Grotesk** provides a sharp, contemporary feel for headlines. **Inter** is used for body text to ensure maximum legibility across all screen types. **Geist** is reserved for labels, metadata, and technical readouts to reinforce the developer-centric, precise nature of the system.

In dark mode, font weights for body text should remain consistent, but color tokens must shift to `text-primary` (Off-white) to prevent "halatting" (visual vibration) that occurs with pure #FFFFFF on #000000.

## Layout & Spacing
The design system employs a **Fluid Grid** model based on a 4px baseline rhythm. For enterprise dashboards, a 12-column grid is standard on desktop, transitioning to a 4-column grid on mobile. 

Spacing is intentionally compact to allow for significant data density without appearing cluttered. Use "Safe Margins" for page containers (40px on desktop) and "Tight Gutters" (24px) for component grouping. In dark mode, whitespace is treated as "negative space" to draw the eye toward active, illuminated components.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layers** and **Low-Contrast Outlines**. 

- **Light Mode:** Uses soft, ambient shadows (0 4px 6px -1px rgb(0 0 0 / 0.1)) to lift cards from the background.
- **Dark Mode:** Shadows are largely ineffective; instead, use light-source borders. Surfaces are differentiated by becoming progressively lighter as they "rise" (e.g., the base background is the darkest, while a modal surface is a lighter indigo-gray). 
- **Borders:** A 1px border using the `border` semantic token is mandatory for all cards and inputs to provide structural definition on dark backgrounds.

## Shapes
The shape language is **Soft (0.25rem)**. This slight rounding provides a professional, "engineered" look that is friendlier than sharp corners but more serious than highly rounded "consumer" styles. 

- **Standard Elements (Buttons, Inputs):** 4px (0.25rem)
- **Large Elements (Cards, Modals):** 8px (0.5rem)
- **Small Elements (Tags, Badges):** 2px (0.125rem)

## Components
### Buttons
Primary buttons use the `accent-primary` color. In dark mode, these should have a subtle inner glow or a higher saturation to stand out. Secondary buttons use an outline style with `text-secondary` and a `border` token.

### Input Fields
Inputs must use a dark surface (`#0F172A`) in dark mode with a 1px border (`#334155`). Focus states must utilize a 2px outer ring of the primary indigo color with 50% opacity.

### Cards
Cards are the primary container. In dark mode, they utilize the `surface` token. To emphasize hierarchy, use a "top-light" border (a subtle 1px stroke on the top edge only) that is 10% lighter than the surface color to simulate a physical light source.

### Chips & Badges
Use low-saturation background tints in dark mode (e.g., a dark emerald for success) with high-saturation text to ensure readability without overpowering the layout.

### Lists & Data Tables
Rows should use a "Zebra Striping" method using `surface` and `surface-elevated` tokens. Hover states should be clearly defined by a 5% increase in surface brightness.