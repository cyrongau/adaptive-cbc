Adaptive CBC: Comprehensive UI & Brand Guide

This document serves as the definitive technical specification and brand guide for the Adaptive CBC platform. It is designed to provide AI engineering agents and frontend developers with the exact tokens, rules, and component behaviors required to replicate the high-fidelity design prototype.



1. Core Brand Identity

Adaptive CBC is an Intelligent & Adaptive Learning System designed for the Kenyan Competency-Based Curriculum (CBC). The visual language is Trustworthy, Academic, Modern, and Empowering. It balances educational rigor with the accessibility of a modern digital product.



2. Design Tokens (The Foundation)

2.1 Color Palette

The system uses a Material Design 3-inspired tonal system, centered around a signature "Academic Green."

Rule: Always use the design system variables (--md-sys-color-primary, etc.) rather than hardcoded hex values to ensure consistency.

2.2 Typography

The typography system uses Nunito Sans for its friendly yet professional character.

Rule: Maintain a strict 4px/8px baseline grid for line heights to ensure vertical rhythm.

2.3 Shape & Spacing





Corner Radius: Default to 8px (ROUND_EIGHT) for cards, buttons, and inputs. Top navigation bars are 0px (docked).



Gutter: 24px (Desktop).



Margins: 120px (Desktop Page Margins).



3. Shared Components Specifications

3.1 Top Navigation Bar





Logic: Fixed to top. Transparent/Blur effect on scroll or solid bg-surface.



Elements: Brand Logo (left), Navigation Links (center), Global Search & User Profile/Notifications (right).



Active State: Primary color text + 2px bottom border.

3.2 Side Navigation (Dashboard View)





Width: 256px.



Structure: Brand header -> Navigation items -> "Upgrade" CTA card -> Footer (Settings/Help).



Style: bg-surface-container-low with a subtle right border border-outline-variant.

3.3 Product/Learning Cards





Construction: Image/Thumbnail -> Badge (e.g., "Physical Book") -> Title -> Publisher -> Rating -> Price -> Action.



Interactions: Subtle scale-102 and shadow-md on hover.



4. Specific UX Rules & Interaction Logic

4.1 "Human-in-the-Loop" OCR Rule

Whenever the system presents AI-generated or extracted content (like digitized papers), it must include a "Needs Review" state. 





Use a Warning Yellow border for elements the AI is uncertain about.



Provide a clear "Mark as Correct" or "Edit" action immediately adjacent to the content.

4.2 Commerce Consistency





Physical vs. Digital: Always use badges. Physical books use "Add to Cart"; Digital materials use "Instant Access" or "Read Now."



Price Display: Format as KES [Amount]. If on sale, show the original price in line-through style using the on-surface-variant color.

4.3 Content Hierarchy





Critical Actions: Use the Primary Green background.



Secondary Actions: Use Outlined buttons or Surface-Container-High backgrounds.



Empty States: Always include an illustration (SVG) and a clear CTA to "Get Started" or "Upload."



5. Implementation Stack Recommendation





Framework: Next.js.



Styling: Tailwind CSS (mapped to the tokens above).



Icons: Material Symbols (Rounded) or Lucide React.



Animation: Framer Motion for smooth transitions (e.g., card hovers, sidebar collapse).



Note to Engineering Agent: Refer to the provided screenshots for the exact pixel-level placement and visual weight. The CSS classes used in the prototypes (Tailwind) are the intended implementation standard.