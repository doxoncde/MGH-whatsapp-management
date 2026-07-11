# UX Requirements Quality Checklist

**Purpose**: Validate UX requirements completeness, clarity, and coverage for the dashboard
**Created**: 2026-07-11
**Feature**: [spec.md](../spec.md)

## Visual Design & Theming

- [ ] CHK001 - Are specific color values defined for the dark theme palette (teal, gold, coral) with contrast ratios specified? [Clarity, Spec §FR-009]
- [ ] CHK002 - Is the dark theme requirement consistent — are all 8 pages explicitly required to use dark mode, or are exceptions allowed? [Consistency, Spec §FR-009]
- [ ] CHK003 - Are typography requirements defined (font family, size hierarchy, line heights) for the dashboard? [Gap, Completeness]
- [ ] CHK004 - Are icon requirements specified — which icon library, consistent sizing, semantic usage rules? [Gap, Clarity]
- [ ] CHK005 - Are spacing/layout grid requirements defined for consistency across pages? [Gap]

## Navigation

- [ ] CHK006 - Is the sidebar navigation behavior specified for all states (collapsed, expanded, active page highlight, mobile hamburger)? [Completeness, Spec §FR-001-008]
- [ ] CHK007 - Are requirements defined for what happens when a user navigates directly to a URL (bookmark support)? [Coverage]
- [ ] CHK008 - Is breadcrumb navigation required or explicitly not required? [Gap]
- [ ] CHK009 - Are keyboard navigation requirements defined (Tab order, Enter to select, Escape to close)? [Gap, Accessibility]
- [ ] CHK010 - Is the back button behavior specified within the SPA routing context? [Coverage]

## Data Visualization (Charts & KPIs)

- [ ] CHK011 - Are chart accessibility requirements defined (alt text, data table fallback, color-blind safe palette)? [Gap, Accessibility]
- [ ] CHK012 - Are KPI card interaction states defined (hover, click for detail, tooltip behavior)? [Clarity, Spec §FR-001]
- [ ] CHK013 - Are requirements specified for chart responsive behavior at different viewport sizes? [Coverage]
- [ ] CHK014 - Is the funnel visualization behavior defined — interactive (click to drill down) vs static? [Clarity, Spec §FR-001]
- [ ] CHK015 - Are chart loading states defined — skeleton, placeholder, or progressive reveal? [Clarity, Spec §FR-010]
- [ ] CHK016 - Are tooltip/popover requirements defined for charts (what data is shown on hover)? [Gap, Clarity]

## Loading, Empty & Error States

- [ ] CHK017 - Are loading state requirements consistent across all 8 pages — skeleton screens, spinners, or progress bars? [Consistency, Spec §FR-010]
- [ ] CHK018 - Are empty state requirements defined for each page — what message and visual is shown when there is no data? [Completeness, Spec §FR-010]
- [ ] CHK019 - Are error state requirements defined — error message placement, retry button behavior, fallback content? [Completeness, Spec §FR-010]
- [ ] CHK020 - Is the transition between loading → content → empty → error states specified to prevent flickering? [Gap, Coverage]

## Forms & Interactions

- [ ] CHK021 - Are form validation requirements defined — inline validation vs submit-time, error message placement, field highlighting? [Gap, Completeness]
- [ ] CHK022 - Are requirements specified for the campaign template composer — variable highlighting, live preview updates, character count? [Clarity, Spec §FR-005]
- [ ] CHK023 - Are notification/toast requirements defined — placement, duration, dismiss behavior, multiple simultaneous toasts? [Gap]
- [ ] CHK024 - Are confirmation dialog requirements specified for destructive actions (delete customer, remove employee)? [Gap]
- [ ] CHK025 - Is search debounce behavior specified for the customer CRM search? [Clarity, Spec §FR-003]

## Responsive Behavior

- [ ] CHK026 - Are responsive breakpoints specifically defined with layout changes at each breakpoint? [Gap, Clarity]
- [ ] CHK027 - Is tablet behavior specified for the sidebar (collapsed by default vs full width)? [Clarity]
- [ ] CHK028 - Are mobile requirements explicitly in or out of scope for v1? [Clarity, Spec §Assumptions]

## Accessibility (WCAG)

- [ ] CHK029 - Are WCAG compliance level requirements defined (AA or AAA) for the dashboard? [Gap]
- [ ] CHK030 - Are screen reader requirements specified for KPI cards, charts, and tables? [Gap, Accessibility]
- [ ] CHK031 - Is focus management specified for modal dialogs, slide-out panels, and page navigation? [Gap, Accessibility]
- [ ] CHK032 - Are minimum touch target sizes specified for interactive elements? [Gap, Accessibility]

## Content & Messaging

- [ ] CHK033 - Is the tone of voice for system messages specified (professional, friendly, resort-appropriate)? [Gap]
- [ ] CHK034 - Are date/time format requirements specified consistently (IST timezone, 12h vs 24h)? [Consistency, Spec §Events]
- [ ] CHK035 - Are currency format requirements specified (₹ symbol, comma separators, decimal places)? [Clarity]
- [ ] CHK036 - Are truncation requirements specified for long names, long messages, overflow content? [Coverage]
