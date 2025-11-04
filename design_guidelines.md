# Design Guidelines: Minimalist Multi-Step Form

## Design Approach
**Reference-Based with System Principles**: Drawing primary inspiration from Typeform's conversational flow and Notion's clean aesthetic, combined with modern minimalist form design principles. The design prioritizes focus, clarity, and a distraction-free experience that guides users through one question at a time.

## Core Design Principles
1. **Radical Simplicity**: Each screen shows only what's immediately necessary - one question, minimal UI chrome
2. **Conversational Flow**: Questions feel like a dialogue, not an interrogation
3. **Delightful Motion**: Transitions reinforce progress and provide spatial continuity
4. **Progressive Disclosure**: Information revealed step-by-step to reduce cognitive load

---

## Typography System
**Primary Font**: Inter (Google Fonts)

**Type Scale**:
- **Question Text**: 32px (mobile: 24px) / font-weight: 600 / line-height: 1.2 - Large, confident, demands attention
- **Input Text**: 20px / font-weight: 400 / Creates visual hierarchy between question and answer
- **Helper Text**: 14px / font-weight: 400 / line-height: 1.5 / Subtle guidance below inputs
- **Progress Indicator**: 14px / font-weight: 500 / Clear system feedback
- **Button Text**: 16px / font-weight: 500 / Action-oriented

**Spacing**: Generous vertical rhythm between question and input (spacing-8 to spacing-12)

---

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 for consistent rhythm

**Screen Structure**:
- **Vertical Centering**: Questions centered vertically for focus (use flexbox with items-center)
- **Horizontal Containment**: Max-width of 640px for optimal readability, centered
- **Edge Padding**: p-6 on mobile, p-8 on tablet+
- **Bottom Anchored Controls**: Progress and navigation fixed to bottom with py-6

**Form Step Layout**:
```
[Progress Indicator - Top Right, Fixed]
  
[Vertical Center]
  Question Number Badge (e.g., "1 →")
  Question Text (Large, Bold)
  spacing-8
  Input Field (Full width within container)
  Helper Text (if applicable)
[/Vertical Center]

[Bottom Fixed Bar]
  Navigation: "Press Enter ↵" hint (left) | Navigation Buttons (right)
[/Bottom Fixed Bar]
```

---

## Component Library

### Input Fields
**Style**: Minimal with bottom border accent
- Background: Transparent or subtle fill (dark mode appropriate)
- Border: None except 2px bottom border
- Border color: Subtle gray (inactive) → Accent #8264FF (active/focus)
- Padding: py-4 for comfortable touch targets
- Border radius: 0 (emphasizes minimalism)
- Focus state: Smooth border color transition, subtle glow effect

### Buttons
**Primary Action** (Continue/Submit):
- Style: Pill-shaped (fully rounded)
- Size: px-8 py-3 minimum
- Background: Accent color #8264FF
- No border, solid fill
- Include arrow icon "→" for forward movement

**Secondary/Ghost**:
- Transparent background
- Accent color text
- Border: 1px solid with accent color
- Used for "Back" navigation

### Progress Indicator
**Style**: Minimalist step counter
- Format: "1 of 3" or visual step dots
- Position: Top-right, fixed
- Visual: Small dots/bars showing current vs. total steps
- Current step: Accent color, others: muted gray
- Subtle spacing between indicators (spacing-2)

### Question Number Badge
**Style**: Small pill badge before question
- Text: "1 →" format
- Background: Subtle accent color with low opacity (10-15%)
- Text color: Accent color
- Size: Small, unobtrusive
- Position: Above question text

### Success Screen
**Layout**: Full-screen confirmation
- Large checkmark icon (accent color, 64px)
- Confirmation headline: "Thank you!" (32px, bold)
- Subtext: Brief confirmation message
- Optional: CTA to return or take another action
- Centered vertically and horizontally

---

## Animation & Transitions

**Page Transitions** (between form steps):
- Type: Combined fade + horizontal slide
- Duration: 300-400ms
- Easing: ease-in-out
- Direction: Slide left when advancing, slide right when going back
- Overlap: Slight crossfade for smoothness

**Input Focus**:
- Border color transition: 200ms ease
- Subtle scale: 1.01 (barely perceptible lift)

**Button Interactions**:
- Hover: Slight brightness increase, 150ms transition
- Active: Scale to 0.98, subtle feedback
- Do NOT implement blur backgrounds on buttons

**Keyboard Hint**:
- Fade in after 800ms delay on each screen
- Pulse animation: Subtle opacity change (0.7 ↔ 1.0, 2s infinite)

---

## Keyboard Shortcuts & Interactions

**Global Shortcuts**:
- **Enter**: Advance to next question (if current field valid)
- **Escape**: Go back one step (except on first question)
- **Tab**: Navigate between interactive elements
- **Shift + Enter**: Submit form (on final question)

**Visual Feedback**:
- Display subtle hint: "Press Enter ↵" below or near input
- Hint positioned: Bottom-left of screen or below input field
- Animated appearance on screen load

---

## Validation & Error States

**Real-Time Validation**:
- Validate on blur, not on every keystroke (reduces anxiety)
- Display errors inline below input field
- Error text: Small (14px), red-tinted color (not pure red - softer)
- Error icon: Optional small warning icon beside text

**Required Field Indicators**:
- Subtle asterisk (*) next to question text
- Or label text "Required" in helper text

**Success Indicators**:
- Checkmark icon (accent color) appears after valid input
- Positioned to the right of input field
- Fade-in animation (200ms)

---

## Dark Mode Implementation

**Background Layers**:
- Primary background: Deep, rich dark (not pure black - e.g., #0F0F0F or #1A1A1A)
- Card/input backgrounds: Slightly lighter than primary (creates subtle depth)
- Overlays: Semi-transparent dark with backdrop blur

**Text Colors**:
- Primary text (questions): Pure white or near-white (#FFFFFF or #F5F5F5)
- Secondary text (helper): Medium gray (#A0A0A0 - #C0C0C0)
- Placeholder text: Subtle gray (#606060 - #707070)

**Accent Usage**:
- Use #8264FF for: Active borders, buttons, progress indicators, links, badges
- Avoid overuse: Reserve for interactive elements and focus states only

**Contrast**:
- Ensure all text meets WCAG AA standards (4.5:1 for body text, 3:1 for large text)
- Test accent color readability on dark backgrounds

---

## Responsive Behavior

**Mobile (< 768px)**:
- Reduce question font size to 24px
- Stack navigation buttons vertically if needed
- Increase touch target sizes: Minimum 44px height for inputs/buttons
- Adjust padding: Tighter spacing (p-4 instead of p-8)

**Tablet (768px - 1024px)**:
- Maintain desktop proportions with slight reductions
- Max-width: 600px container

**Desktop (> 1024px)**:
- Max-width: 640px container
- Generous whitespace around form
- Larger typography for impact

---

## Accessibility

**Focus Management**:
- Auto-focus input field on each new question
- Visible focus rings on all interactive elements (accent color)
- Skip to main content link (visually hidden, keyboard accessible)

**Screen Reader Support**:
- Semantic HTML: Use `<form>`, `<label>`, `<input>` elements
- ARIA labels for progress indicator and navigation
- Live region announcements for validation errors

**Keyboard Navigation**:
- All functionality accessible via keyboard
- Logical tab order through form elements
- Clear visual indicators for focused elements

---

## Images
**Not Applicable**: This is a pure form interface. No hero images or decorative imagery needed. The design relies on typography, whitespace, and minimal UI elements to create visual impact. The focus should remain entirely on the form interaction.