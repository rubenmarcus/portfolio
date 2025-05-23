# Cyberpunk Links Guide

## Overview

This project implements a custom Link component that applies a cyberpunk text scramble effect to all links by default. The implementation consists of two main components:

1. `CyberpunkLink`: The core component that implements the text scramble effect
2. `Link`: A wrapper around Next.js's Link component that applies the cyberpunk effect by default

## Usage

### Basic Usage

Simply import the custom Link component instead of Next.js's Link:

```tsx
// Instead of this:
import Link from "next/link"

// Use this:
import Link from "@/components/ui/link"

// Then use it normally
<Link href="/about">About</Link>
```

### Link Variants

There are two variants of the cyberpunk effect:

1. `link` (default): Applied to regular navigation links - scrambles text but doesn't add drop shadow
2. `button`: Applied to call-to-action buttons - adds glow/drop shadow effect on hover

```tsx
// Regular link (default)
<Link href="/about">About</Link>

// Button-style link with glow effect
<Link href="/contact" variant="button">Contact Me</Link>

// Or use the dedicated button component
<CyberpunkButton href="/portfolio">View My Work</CyberpunkButton>
```

### Disabling the Effect

If you want a link without the cyberpunk effect, use the `cyberpunk` prop:

```tsx
<Link href="/about" cyberpunk={false}>About</Link>
```

### Styling

The component adds the `cyberpunk-button` class to all links. You can add additional classes using the `className` prop:

```tsx
<Link
  href="/contact"
  className="text-green-400 hover:text-green-300 transition-colors"
>
  Contact
</Link>
```

## Implementation Details

The cyberpunk effect:
1. Tracks mouse hover state
2. When hovering, scrambles text characters with special characters and Japanese katakana
3. Gradually reduces the scrambling effect over time
4. Returns to the original text after animation completes

## CSS

The cyberpunk styling is defined in `app/globals.css` using:
- `.cyberpunk-button`: Base styling for all links
- `.cyberpunk-button-shadow`: Additional styling for button variants only