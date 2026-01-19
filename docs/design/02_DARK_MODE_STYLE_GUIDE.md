# K-man Island - Dark Mode Style Guide

**Version:** 1.0.0  
**Last Updated:** 2026-01-19  
**Status:** LOCKED ✅

---

## Overview

This document defines the official dark mode styling for K-man Island. All dark mode colors and patterns are locked and should not be changed without updating this documentation.

---

## Core Color Palette

### Primary Colors

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Background** | `#040710` | `225 60% 4%` | Main background, cards, sidebar |
| **Hover/Muted** | `#212936` | `220 26% 17%` | Hover states, muted backgrounds |
| **Border** | `#2a3444` | `220 20% 22%` | All borders, dividers |
| **Table Header** | `#121826` | `222 36% 11%` | Table headers, subtotals, totals |

### Text Colors

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Primary Text** | `#e2e8f0` | `214 32% 91%` | Main text content |
| **Muted Text** | `#94a3b8` | `215 20% 65%` | Secondary text, labels |

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Brand Emerald** | `#10B981` | Primary actions, success, active states |
| **Brand Slate** | `#1E293B` | Dark backgrounds in light mode |
| **Brand Rose** | `#F43F5E` | Errors, negative values, sell signals |

---

## Semantic Alert Colors

Alert backgrounds use low opacity (10-20%) to maintain dark theme while preserving semantic meaning.

| Type | Background | Border | Text |
|------|------------|--------|------|
| **Success** | `hsl(142 76% 36% / 0.15)` | `hsl(142 76% 36% / 0.3)` | `hsl(142 76% 55%)` |
| **Warning** | `hsl(45 93% 47% / 0.15)` | `hsl(45 93% 47% / 0.3)` | `hsl(45 93% 65%)` |
| **Error** | `hsl(0 84% 60% / 0.08)` | `hsl(0 84% 60% / 0.25)` | `hsl(0 84% 70%)` |
| **Info** | `hsl(217 91% 60% / 0.1)` | `hsl(217 91% 60% / 0.3)` | `hsl(217 91% 70%)` |

---

## Component Specifications

### Sidebar

```css
/* Container */
background: #040710;
border-right: 1px solid #2a3444;

/* Navigation Item - Inactive */
color: #94a3b8;
background: transparent;

/* Navigation Item - Hover */
background: #212936;
color: #e2e8f0;

/* Navigation Item - Active */
background: #10B981;
color: white;
```

### Cards & Panels

```css
background: #040710;
border: 1px solid #2a3444;
border-radius: 1rem; /* rounded-2xl */
```

### Tables

```css
/* Header */
background: #121826;
color: #e2e8f0;

/* Rows */
background: #040710;

/* Row Hover */
background: #212936;

/* Subtotal/Total Rows */
background: #121826;
color: white;
font-weight: bold;

/* Borders */
border-color: #2a3444;
```

### Form Inputs

```css
background: #040710;
border: 1px solid #2a3444;
color: #e2e8f0;

/* Placeholder */
color: #94a3b8;

/* Focus */
border-color: #10B981;
```

### Buttons

```css
/* Primary */
background: #10B981;
color: white;

/* Secondary */
background: #212936;
color: #e2e8f0;

/* Destructive */
background: #dc2626;
color: white;

/* Ghost/Muted */
background: transparent;
color: #94a3b8;
```

---

## Special Components

### Theme Toggle

```
Dark Mode ON:
- Toggle background: #10B981 (brand-emerald)
- Switch position: RIGHT
- Label: "Dark modus"

Light Mode ON:
- Toggle background: #d1d5db (gray-300)
- Switch position: LEFT
- Label: "Lys modus"
```

### E24 Filter Button (Active State)

```css
/* Always black background with white text in both modes */
background: #000000;
color: white;
```

### Core Brief Section

```css
/* Container */
background: #0a1a14; /* Very dark green tint */
border: 1px solid rgba(16, 185, 129, 0.2); /* emerald with low opacity */

/* Inner boxes */
background: rgba(6, 78, 59, 0.3); /* emerald-950/30 */
```

### Markedsoversikt Section

```css
/* Container */
background: #0a0f1a; /* Very dark blue tint */
border: 1px solid rgba(59, 130, 246, 0.2); /* blue with low opacity */

/* Inner boxes */
background: rgba(23, 37, 84, 0.3); /* blue-950/30 */
```

---

## Scrollbar

```css
/* Track */
background: #040710;

/* Thumb */
background: #212936;
border-radius: 3px;

/* Thumb Hover */
background: #2a3444;
```

---

## Badge System

### Signal Badges

```css
/* KJØP (Buy) */
.badge-buy {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* HOLD */
.badge-watch {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* SELG (Sell) */
.badge-sell {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

---

## CSS Variables Reference

```css
.dark {
  /* Backgrounds */
  --background: 225 60% 4%;        /* #040710 */
  --card: 225 60% 4%;              /* #040710 */
  --muted: 220 26% 17%;            /* #212936 */
  --popover: 220 26% 14%;
  
  /* Text */
  --foreground: 214 32% 91%;       /* #e2e8f0 */
  --muted-foreground: 215 20% 65%; /* #94a3b8 */
  
  /* Borders */
  --border: 220 20% 22%;           /* #2a3444 */
  --input: 220 20% 22%;
  
  /* Tables */
  --table-header-bg: 222 36% 11%;  /* #121826 */
  --subtotal-bg: 222 36% 11%;
  --total-bg: 222 36% 11%;
  
  /* Scrollbar */
  --scrollbar-track: #040710;
  --scrollbar-thumb: #212936;
  --scrollbar-thumb-hover: #2a3444;
}
```

---

## Implementation Notes

### Global CSS Overrides

The `globals.css` file contains overrides that convert hardcoded Tailwind classes to dark mode values without requiring JSX changes:

- `.dark .bg-white` → `#040710`
- `.dark .bg-gray-50`, `.dark .bg-gray-100` → `#212936`
- `.dark .text-gray-900` → `--foreground`
- `.dark .border-gray-200` → `--border`
- And many more...

### When to Use Custom Dark Classes

For new components, prefer using:
1. Semantic tokens: `bg-card`, `text-foreground`, `border-border`
2. Dark variants: `dark:bg-[#040710]`, `dark:text-gray-200`
3. Opacity-based colors for semantic meaning: `dark:bg-emerald-950/30`

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-19 | 1.0.0 | Initial dark mode style guide locked |

---

## Contact

For questions about the dark mode design system, check with the project maintainer before making changes.
