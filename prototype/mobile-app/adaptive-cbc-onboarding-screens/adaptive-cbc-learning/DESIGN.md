---
name: Lumina Mobile
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3f4940'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6f7a6f'
  outline-variant: '#becabd'
  surface-tint: '#006d36'
  primary: '#006a34'
  on-primary: '#ffffff'
  primary-container: '#268549'
  on-primary-container: '#f6fff3'
  inverse-primary: '#7eda95'
  secondary: '#296a40'
  on-secondary: '#ffffff'
  secondary-container: '#adf2bc'
  on-secondary-container: '#307146'
  tertiary: '#535e59'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c7772'
  on-tertiary-container: '#f5fff9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9af7af'
  primary-fixed-dim: '#7eda95'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005227'
  secondary-fixed: '#adf2bc'
  secondary-fixed-dim: '#92d6a2'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#09522a'
  tertiary-fixed: '#d9e5de'
  tertiary-fixed-dim: '#bdc9c3'
  on-tertiary-fixed: '#131e1a'
  on-tertiary-fixed-variant: '#3e4944'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  margin-mobile: 20px
  gutter-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  bottom-nav-height: 80px
---

## Brand & Style
The design system focuses on an accessible, mobile-first academic experience. It evolves the traditional scholarly aesthetic into a "Modern-Academic" style, blending the reliability of educational institutions with the fluid, tactile interactions expected of contemporary mobile apps. 

The personality is supportive, organized, and focused. The UI leverages a "Fluid-Modern" movement: a mix of clean whitespace, soft tactile surfaces, and a clear functional hierarchy. The emotional response is one of clarity and progress, ensuring students and educators feel empowered even when using the platform on the go or in bright, outdoor environments.

## Colors
The palette is anchored by "Academic Green" (#2d8a4e), optimized here for high-visibility mobile use. 

- **Primary:** Used for the central Action Button and key interactive states.
- **Secondary:** A deeper shade for high-contrast text and critical icons to ensure WCAG AAA compliance for outdoor readability.
- **Tertiary:** A soft mint tint used for background sections and subtle chip states.
- **Neutral:** A deep off-black for primary text to reduce eye strain while maintaining maximum contrast against the white background.

## Typography
This design system utilizes **Nunito Sans** for all levels to maintain a friendly yet structured appearance. On mobile, font weights are slightly increased to ensure legibility under varying light conditions. 

Headlines use a tighter letter-spacing to feel more cohesive on narrow screens. Body text scales to a comfortable 16px/18px base to ensure high readability for long-form academic content. Labels are set in a slightly bolder weight to differentiate them from body copy at smaller scales.

## Layout & Spacing
The layout follows a fluid, single-column model for mobile, prioritizing a vertical scroll rhythm. 

- **Margins:** A generous 20px side margin prevents content from feeling cramped.
- **Gutter:** 16px spacing between cards and elements within the flow.
- **Bottom Navigation:** A prominent 80px tall bar sits at the base, featuring a 56px circular floating Action Button (FAB) docked in the center.
- **Safe Areas:** All interactive elements are sized with a minimum 44px hit target to accommodate handheld interaction.

## Elevation & Depth
Hierarchy is established through soft, ambient shadows and subtle tonal layering. 

- **Surface Level (0dp):** The main application background.
- **Card Level (2dp):** Uses a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.06)) to lift content modules gently off the background.
- **Navigation Level (8dp):** The bottom bar and central Action Button use a more pronounced shadow (0px 6px 20px rgba(45,138,78,0.2)) to signify their priority and floating nature.
- **Overlays:** Full-screen modals use a 40% opacity neutral-tinted backdrop to maintain context.

## Shapes
The shape language is "Approachable-Geometric." 

- **Cards & Containers:** Set at 12px (0.75rem) to feel friendly and modern.
- **Buttons:** Standard buttons use the 12px radius, while the central Action Button is a perfect circle (pill/rounded-full).
- **Input Fields:** Utilize the 12px radius to match the card language, creating a consistent visual container system.

## Components
- **Action Button (FAB):** The centerpiece of the navigation bar. It is a 56px circle in Academic Green with a white icon, elevated higher than other elements.
- **Bottom Navigation:** A solid white or slightly translucent blurred surface containing 4 icon-label pairs and the central action button. Icons use 24px sizing.
- **Cards:** White background with a 12px border radius and 1px subtle stroke (#e9f5ee) for definition. Internal padding is set to 16px.
- **Input Fields:** Filled style using Tertiary Green (#e9f5ee) as the background with a 2px bottom border that transforms into a full Academic Green outline on focus.
- **Chips:** Highly rounded (100px) with Tertiary Green backgrounds and Secondary Green text, used for tags and filters.
- **Lists:** Clean dividers using 1px Tertiary Green, with 12px vertical padding for each list item to ensure ease of tapping.