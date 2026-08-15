---
name: Titan Kinetic
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393d'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c1f'
  surface-container: '#1e2023'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e7'
  on-surface-variant: '#c3c6d1'
  inverse-surface: '#e2e2e7'
  inverse-on-surface: '#2f3034'
  outline: '#8d919a'
  outline-variant: '#43474f'
  surface-tint: '#a7c8ff'
  primary: '#a7c8ff'
  on-primary: '#003061'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#3a5f94'
  secondary: '#e9c349'
  on-secondary: '#3c2f00'
  secondary-container: '#af8d11'
  on-secondary-container: '#342800'
  tertiary: '#ffb690'
  on-tertiary: '#552100'
  tertiary-container: '#592300'
  on-tertiary-container: '#d8885c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#723610'
  background: '#121317'
  on-background: '#e2e2e7'
  surface-variant: '#333539'
  deep-navy: '#003366'
  titan-gold: '#D4AF37'
  surface-dark: '#050C14'
  surface-light: '#F8F9FA'
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

This design system embodies an authoritative, high-performance aesthetic tailored for strategic enterprise consulting and industrial transformation. It merges **Corporate Modern** reliability with a **Minimalist** focus on data density and clarity.

The brand personality is prestigious and secure, evoking a sense of "Established Innovation." The UI utilizes sharp, technical precision-engineered layouts to communicate stability. The emotional response should transition from "Academic and Trusted" in light mode to a "Mission Control" atmosphere in dark mode, reflecting a high-end command-center experience. Visual elements should feel robust, responsive, and meticulously organized.

## Colors

The palette is anchored by a deep navy and golden yellow, derived from the brand’s strategic identity. This design system utilizes a semantic architecture to handle both light and dark environments effectively.

- **Primary (Deep Navy):** Represents authority and depth. In dark mode, it acts as the structural foundation, while in light mode, it provides high-contrast navigation and text anchoring.
- **Secondary (Titan Gold):** Used sparingly as an accent for critical actions, active states, and highlights. It provides a "luminous" quality against dark surfaces and a premium "executive" feel in light mode.
- **Neutral/Surface:** Dark mode is built on an "ink-blue" foundation (`#050C14`) to maintain brand tinting even in shadows. Light mode utilizes cool-tinted whites to ensure a clean, modern finish.

## Typography

The typographic hierarchy is designed for high-density information environments where legibility is paramount.

- **Hanken Grotesk** is used for headlines, providing a sharp, contemporary, and confident voice.
- **Inter** serves as the workhorse for body copy, offering maximum readability across varying screen densities.
- **Geist** is reserved for labels, monospaced data, and technical readouts to reinforce the precise, "engineered" nature of the product.

In dark mode, text colors shift to an off-white to prevent visual vibration, while the golden accent font is reserved for primary navigational highlights and key metrics.

## Layout & Spacing

This design system employs a **Fluid Grid** model based on a 4px baseline rhythm.

- **Desktop:** A 12-column grid with 24px gutters allows for complex enterprise dashboards. Safe margins of 40px ensure content remains centered and legible.
- **Mobile:** Transition to a 4-column grid with 16px margins to maximize horizontal real estate.
- **Rhythm:** Spacing is intentionally compact to allow for significant data density. Use the 4px unit for internal component padding to maintain a tight, professional structure.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Tiers:** Surfaces are differentiated by becoming progressively lighter as they "rise" toward the user. In dark mode, the base background is the darkest, while modals and floating cards use a slightly lighter navy-gray tint.
- **Borders:** A 1px border is mandatory for all structural elements (cards, inputs, containers). In dark mode, these borders use a subtle navy-tinted gray (`#1C2B3C`) to provide definition without excessive contrast.
- **Shadows:** Only used in light mode (soft, ambient, low-opacity). In dark mode, depth is strictly tonal, occasionally utilizing a "top-light" 1px stroke on cards to simulate a physical light source from above.

## Shapes

The shape language is **Soft (0.25rem)**. This geometric discipline reflects a professional, "engineered" look that prioritizes structural integrity over organic softness.

- **Buttons & Inputs:** 4px (0.25rem) for a standard, crisp appearance.
- **Cards & Modals:** 8px (0.5rem) to provide a gentle but clear distinction for large containers.
- **Badges:** 2px (0.125rem) or 0px for a more industrial, technical feel.

## Components

### Buttons
Primary buttons utilize the Deep Navy background with Gold text or vice-versa for high-priority CTA. In Dark Mode, primary buttons should have a subtle 1px border of the Gold accent to ensure they pop against dark backgrounds.

### Input Fields
Inputs use a dark surface tint in dark mode with a 1px border. Focus states must utilize the Gold accent as a 2px outer ring or a solid 2px bottom border to clearly signal activity.

### Cards
Cards are the primary organizational unit. They should use a 1px border. In Dark Mode, the background of a card is one step lighter than the page background to indicate elevation.

### Chips & Badges
Use high-contrast combinations: Gold text on a Deep Navy background for "Featured" or "Active" items. For status indicators (Success/Error), use desaturated background tints with high-saturation text to maintain the professional palette.

### Lists & Data Tables
Maintain high density with "Zebra Striping" using the tonal surface tiers. Hover states should be indicated by a subtle shift toward the Gold accent or a 5% increase in surface brightness.