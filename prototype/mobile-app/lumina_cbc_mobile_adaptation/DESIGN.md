---
name: Lumina CBC Mobile Adaptation
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3f4940'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6f7a6f'
  outline-variant: '#becabd'
  surface-tint: '#006d36'
  primary: '#006a34'
  on-primary: '#ffffff'
  primary-container: '#268549'
  on-primary-container: '#f6fff3'
  inverse-primary: '#7eda95'
  secondary: '#376847'
  on-secondary: '#ffffff'
  secondary-container: '#b6edc2'
  on-secondary-container: '#3b6d4b'
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
  secondary-fixed: '#b9efc5'
  secondary-fixed-dim: '#9ed3aa'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#1e5031'
  tertiary-fixed: '#d9e5de'
  tertiary-fixed-dim: '#bdc9c3'
  on-tertiary-fixed: '#131e1a'
  on-tertiary-fixed-variant: '#3e4944'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
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
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.5px
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.5px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 44px
  margin-edge: 1rem
  gutter: 0.75rem
  stack-sm: 0.5rem
  stack-md: 1rem
  inset-squish: 0.5rem 0.75rem
---

## Brand & Style
The design system focuses on high-density information architecture tailored for mobile educational and academic environments. The style is **Corporate / Modern**, emphasizing reliability, clarity, and systematic organization. 

The target audience consists of students, educators, and administrators who require quick access to complex competency-based curriculum (CBC) data. The UI evokes a sense of organized intelligence and accessibility, utilizing a refined professional aesthetic that balances academic tradition with modern efficiency. We prioritize functional density over excessive whitespace to ensure data-rich views remain actionable on smaller glass surfaces.

## Colors
The palette is anchored by **Academic Green (#2d8a4e)**, representing growth and institutional stability. 

- **Primary**: Used for key actions, active states, and progress indicators.
- **Secondary**: A deeper forest green used for headers and structural emphasis to provide visual weight.
- **Tertiary**: A soft mint tint used for large surface areas and background groupings to reduce eye strain during long reading sessions.
- **Neutral**: High-contrast grays and blacks ensure WCAG AA compliance for all body text and data labels.

## Typography
We utilize **Nunito Sans** across all levels for its high x-height and open counters, which maintain legibility at smaller scales.

To accommodate high-density information, we scale down headlines while maintaining a robust 16px base for primary body text. Labels use uppercase and increased tracking to differentiate themselves from data values within dense tables and lists. On mobile, we avoid font sizes below 10px to ensure accessibility for all users.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for narrow viewports. We utilize a 4-column grid for mobile with 16px (1rem) outer margins and 12px (0.75rem) gutters.

Key structural rules:
- **Touch Targets**: All interactive elements (buttons, links, checkboxes) must maintain a minimum height/width of 44px to prevent accidental taps.
- **Information Density**: Vertical spacing between related data items is condensed to 8px (0.5rem) to maximize the "above the fold" content.
- **Safe Areas**: Content must respect system-level safe areas (notches/home indicators) using the `margin-edge` variable.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** rather than heavy shadows to keep the interface feeling light and fast on mobile processors.

- **Level 0**: The main background, using the tertiary green tint or white.
- **Level 1**: Cards and containers use a subtle low-contrast outline (1px, 10% opacity black) to define boundaries without adding visual clutter.
- **Level 2**: Floating Action Buttons (FABs) or sticky footers use a soft, 12% opacity ambient shadow to indicate they sit above the scrolling content.
- **Dividers**: Use a 1px solid stroke in a light neutral gray to separate list items and data rows.

## Shapes
The design system utilizes **Soft** geometry. Standard UI elements like input fields and buttons carry a 4px (0.25rem) radius. Larger containers, such as modal sheets or course cards, use an 8px (0.5rem) radius. This subtle rounding maintains a professional "academic" tone while feeling modern and touch-friendly.

## Components
- **Buttons**: Primary buttons are full-width on mobile to maximize hit area. Use the `primary-color` with white text. Height is fixed at 48px.
- **Chips**: Used for filtering competencies. These use the 44px touch-target rule for height and include a 12px horizontal padding.
- **Lists**: The core of the CBC experience. List items should have a minimum height of 56px with clear 16px padding on left/right edges.
- **Input Fields**: Borders are 1px solid neutral. Labels are placed above the field in `label-md` style to ensure they remain visible during typing.
- **Cards**: Use a white background with a subtle border. Padding inside cards is reduced to 12px to prioritize content space.
- **Progress Bars**: Essential for curriculum tracking. These should be 8px tall with a 4px border radius, using the primary green for the fill.
- **Bottom Sheets**: Used for complex filtering or detailed item views instead of centered modals to allow for easier thumb-reach.