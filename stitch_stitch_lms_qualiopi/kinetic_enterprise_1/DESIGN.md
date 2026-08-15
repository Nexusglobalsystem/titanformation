---
name: Kinetic Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for a premium, high-stakes educational environment. It targets enterprise-level administrators, rigorous instructors, and modern learners who demand clarity and efficiency. The aesthetic is **High-End Minimalism**—drawing inspiration from the utilitarian precision of developer tools and the polished elegance of global fintech.

The emotional response should be one of "effortless mastery." By utilizing expansive whitespace, we reduce cognitive load, allowing the complex data of Qualiopi-certified learning paths to feel manageable. The style incorporates subtle **Glassmorphism** for navigational depth and a **Corporate Modern** structural integrity that communicates reliability and prestige.

## Colors

The palette is centered around **Indigo 600 (#6366F1)**, chosen for its professional yet modern energy. 

- **Primary:** Used for actionable elements, progress indicators, and brand identification.
- **Secondary (Slate/Navy):** Provides high-contrast grounding for text and structural borders.
- **Accents:** **Emerald 500** signifies compliance and success (crucial for certification tracking), while **Amber 500** is reserved for urgent warnings or pending validations.
- **Surface Strategy:** In light mode, surfaces use pure white with ultra-thin `#E2E8F0` borders. In dark mode, we utilize a deep `#020617` base with `#1E293B` containers to maintain depth without losing the premium "ink" feel.

## Typography

This design system leverages **Inter** for its exceptional readability and neutral, systematic tone. For technical labels and metadata—especially relevant for tracking Qualiopi IDs and timestamps—we introduce **Geist** to provide a precise, developer-centric feel.

**Hierarchy Rules:**
- **Tracking:** Headlines use tight negative letter-spacing (-0.02em) to create a "locked-in" premium look.
- **Readability:** Body text maintains a generous 1.5x line height to ensure long-form course content remains accessible.
- **Contrast:** Utilize `Slate 900` for headings and `Slate 600` for body text to create clear visual pathways.

## Layout & Spacing

The layout employs a **Fluid Grid** model based on a 12-column system.

- **Desktop:** 48px outer margins with 24px gutters. Content is centered with a max-width of 1440px to prevent line lengths from becoming unreadable on ultra-wide monitors.
- **Mobile:** 16px margins with a single-column reflow. Sidebars collapse into a bottom-sheet or a full-screen glassmorphic overlay.
- **Rhythm:** We use a strict 4px / 8px incremental scale. All component padding and margins must be multiples of 4 to maintain mathematical harmony across the UI.

## Elevation & Depth

Depth is signaled through **Tonal Layering** and **Subtle Ambient Shadows**. 

1.  **The Base Layer:** The primary canvas (Background).
2.  **The Card Layer:** Raised using a 1px border (`Slate 200` in light mode) and a very soft, high-diffusion shadow: `0 4px 6px -1px rgb(0 0 0 / 0.05)`.
3.  **The Interaction Layer:** Navigation bars and sticky headers use a **Backdrop Blur (12px)** with a 70% transparent surface color to create a sense of place.
4.  **The Floating Layer:** Modals and dropdowns use a more pronounced shadow to indicate temporary focus.

Avoid heavy black shadows; instead, use tinted shadows (e.g., a shadow with a hint of the primary indigo) to maintain a modern, clean aesthetic.

## Shapes

The shape language is deliberately soft to offset the professional "seriousness" of the platform.

- **Standard Elements:** Buttons and inputs use a 0.5rem (8px) radius.
- **Containers:** Dashboard cards and main content areas use `rounded-2xl` (1rem) or `rounded-3xl` (1.5rem) to create a distinct, modern container feel.
- **Status Pills:** Badges for "Certified," "In Progress," or "Complete" are fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Indigo 600, white text, subtle inner top-border for a "pressed" look.
- **Secondary:** Transparent background, Slate 200 border, Indigo 600 text.
- **Ghost:** No border or background until hover.

### Cards
- **The "LMS Card":** Used for courses. Includes a 1.5rem corner radius, a subtle 1px border, and a bottom-aligned progress bar using the Primary color.

### Data Tables
- **Professional Grid:** No vertical lines. Only subtle horizontal dividers. The header row should have a slightly darker neutral background (`Slate 50`) and use the `label-sm` typography style for clarity.

### Inputs
- **Focused State:** A 1px Indigo 600 border with a 4px Indigo-tinted outer glow (soft shadow).
- **Labels:** Always positioned above the field using `label-md` for accessibility.

### Progress Indicators
- Use a thick 8px rounded bar for course progress. For Qualiopi compliance metrics, use circular gauges with high-contrast Emerald/Slate coloring.

### Glass Sidebar
- A fixed left-hand navigation with `backdrop-blur-md` and a semi-transparent background. Active states should be indicated by a solid Primary-colored vertical "pill" on the left edge.