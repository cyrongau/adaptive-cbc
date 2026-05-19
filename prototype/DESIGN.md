---
name: Lumina CBC
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4940'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6f7a6f'
  outline-variant: '#becabd'
  surface-tint: '#006d36'
  primary: '#006a34'
  on-primary: '#ffffff'
  primary-container: '#268549'
  on-primary-container: '#f6fff3'
  inverse-primary: '#7eda95'
  secondary: '#455f88'
  on-secondary: '#ffffff'
  secondary-container: '#b6d0ff'
  on-secondary-container: '#3f5882'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a900'
  on-tertiary-container: '#4c3f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9af7af'
  primary-fixed-dim: '#7eda95'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005227'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#adc7f7'
  on-secondary-fixed: '#001b3c'
  on-secondary-fixed-variant: '#2d476f'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Nunito Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Nunito Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is built to bridge the gap between rigorous academic standards and the joyous, exploratory nature of childhood learning. It targets the Kenyan CBC (Competency-Based Curriculum) ecosystem, ensuring that students from Grade 1 to 9 feel supported by an "intelligent companion" rather than a cold interface.

The style is **Professional yet Playful**. It leverages a modern, card-based architecture that simplifies complex learning paths into digestible modules. By combining the structured reliability of corporate SaaS with the vibrant energy of educational gaming, the UI evokes feelings of growth, curiosity, and academic confidence. The interface must remain highly accessible to accommodate varying levels of digital literacy among parents and students in diverse environments.

## Colors

The palette is rooted in the "Success Green" (#2D8A4E), symbolizing the lush growth and agricultural heritage of Kenya, while serving as the primary action color for advancement and achievement.

- **Success Green (Primary):** Used for primary buttons, progress indicators, and "correct" states. It signals momentum.
- **Deep Scholastic Blue (Secondary):** Used for navigation, sidebars, and headings. It provides the "scholastic" weight and trust needed for tutors and parents.
- **Energetic Yellow (Tertiary):** Reserved for gamification elements like stars, badges, and high-priority call-outs. It should be used sparingly to maintain its impact.
- **Backgrounds:** A soft off-white (#F8FAFC) reduces eye strain during long study sessions, while pure white is reserved for content cards to create clear separation.

## Typography

**Nunito Sans** is selected for its friendly, rounded terminals which are highly legible for early-grade readers and reduce the "intimidation factor" of dense text. 

- **Headlines:** Use Bold (700) or ExtraBold (800) weights to create a strong hierarchy. Large sizes are encouraged to guide the student's eye toward the lesson's core focus.
- **Body Text:** Maintained at 18px for lesson content to ensure maximum readability on mobile devices, which are common in Kenyan households. 
- **Accessibility:** Ensure a minimum contrast ratio of 4.5:1 for all text against its background. Avoid using Yellow for any text smaller than 24px Bold.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model centered on a card-based hierarchy. The layout should feel airy and uncrowded to help students focus on one task at a time.

- **Grid:** A 12-column grid for desktop and a 4-column grid for mobile.
- **Spacing Rhythm:** Based on an 8px scale. Use `md` (24px) for the majority of internal card padding to create a spacious, high-end feel.
- **Max Width:** Content should be capped at 1200px to prevent line lengths from becoming too long for comfortable reading.
- **Mobile First:** Given the prevalence of mobile learning, all cards should stack vertically on small screens, with margins reducing to 16px to maximize screen real estate.

## Elevation & Depth

Visual hierarchy is established through **Ambient Shadows** and **Tonal Layers**. This creates a tactile, "clickable" environment that encourages interaction.

- **Level 0 (Background):** Neutral light gray (#F8FAFC).
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)).
- **Level 2 (Interactive/Hover):** When a user hovers over a lesson card or button, the shadow should deepen and the element should lift slightly (Y-axis -2px).
- **Glassmorphism:** Use subtle backdrop blurs (10px) for top navigation bars to maintain context of the content scrolling beneath them, enhancing the "modern" AI feel.

## Shapes

The shape language is defined by **Roundedness Level 2**. This eliminates sharp "scary" corners, replacing them with friendly, approachable curves that signify safety and inclusivity.

- **Small Components (Buttons, Inputs):** 0.5rem (8px) corner radius.
- **Container Elements (Cards, Modals):** 1rem (16px) corner radius.
- **Featured Elements:** Large hero images or promotional banners may use 1.5rem (24px) to emphasize the "Organic" feel of the brand.
- **Pill Shapes:** Toggle switches and secondary "Tags" or "Chips" should use full pill rounding for maximum distinction from primary action buttons.

## Components

### Buttons
- **Primary:** Success Green background, white text. Bold and high-contrast.
- **Secondary:** Deep Scholastic Blue outline with 2px stroke. Used for "Save for Later" or "View Previous."
- **Gamified:** Energetic Yellow background with dark navy text. Reserved specifically for "Start Quiz" or "Claim Reward."

### Cards
- Lesson cards must include a progress bar at the bottom.
- Use a 1px soft gray border (#E2E8F0) in addition to shadows to ensure cards don't "bleed" into each other on lower-quality screens.

### Inputs & Selection
- **Input Fields:** Large tap targets (minimum 48px height) with 16px internal padding.
- **Checkboxes/Radios:** Oversized (24px x 24px) to accommodate younger users with developing fine motor skills.

### AI Assistant (The "Lumina" Guide)
- A dedicated component for AI-generated hints. This should use a light tint of the Secondary Blue as a background with a distinctive "sparkle" icon to denote AI-generated content.

### Progress Indicators
- Use the Primary Green for completion. For CBC-specific "Competency Levels" (Exceeding, Meeting, Approaching, Below Expectation), use a multi-step horizontal track with descriptive icons.