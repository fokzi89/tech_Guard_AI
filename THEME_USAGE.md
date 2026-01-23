# Theme Usage Guide

This document explains how to use the centralized theme system in TechGuard AI.

## Overview

The application uses a global theme system with CSS variables that automatically switch between dark and light modes:

- **Light Mode**: `#F0FFFF` (cyan) background with `#03002e` (dark blue) text and buttons
- **Dark Mode**: `#03002e` (dark blue) gradient background with `#F0FFFF` (cyan) text and buttons

## Color Scheme

### Light Mode
- Background: `#F0FFFF` - Light cyan
- Text/Buttons: `#03002e` - Very dark blue
- Components (nav/sidebar): Dark blue (#03002e) to stand out

### Dark Mode
- Background: `#03002e` - Very dark blue with gradient
- Text/Buttons: `#F0FFFF` - Light cyan
- Components (nav/sidebar): Light cyan (#F0FFFF) to stand out

## Using Theme Colors in Components

### Method 1: Tailwind CSS Classes

Use the predefined Tailwind classes that reference CSS variables:

```tsx
// Background and text
<div className="bg-background text-foreground">
  Content with theme-aware colors
</div>

// Buttons
<button className="bg-primary text-primary-foreground hover:opacity-90">
  Primary Button
</button>

// Cards
<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  Card content
</div>

// Navigation bar
<nav className="bg-nav text-nav-foreground">
  <a href="#" className="hover:bg-nav-hover">Link</a>
</nav>

// Sidebar
<aside className="bg-sidebar text-sidebar-foreground">
  Sidebar content
</aside>
```

### Method 2: CSS Custom Classes

Use the predefined utility classes in `globals.css`:

```tsx
// Gradient background (automatically adapts to theme)
<div className="gradient-blue-bg">
  <h1 className="gradient-text">Main heading</h1>
  <p className="gradient-text-muted">Subtitle text</p>
</div>

// Cards with backdrop blur
<div className="gradient-card gradient-card-hover">
  Theme-aware card with hover effect
</div>

// Glass panel effect
<div className="glass-panel glass-panel-hover">
  Glassmorphism panel
</div>

// Navigation
<nav className="nav-bar">
  <a href="#" className="nav-item">Navigation Link</a>
</nav>

// Sidebar
<aside className="sidebar">
  <a href="#" className="sidebar-item">Sidebar Link</a>
</aside>
```

### Method 3: Inline Styles with CSS Variables

For custom styling, use CSS variables directly:

```tsx
<div style={{
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  border: '1px solid hsl(var(--border))'
}}>
  Custom styled element
</div>
```

## Available Color Variables

### Base Colors
- `--background` / `bg-background` - Page background
- `--foreground` / `text-foreground` - Main text color
- `--primary` / `bg-primary` - Primary buttons/accents
- `--secondary` / `bg-secondary` - Secondary elements
- `--muted` / `bg-muted` - Muted backgrounds
- `--accent` / `bg-accent` - Accent highlights
- `--destructive` / `bg-destructive` - Error/danger states
- `--border` / `border-border` - Borders
- `--input` / `bg-input` - Input backgrounds
- `--ring` / `ring-ring` - Focus rings

### Component-Specific Colors
- `--nav-bg` / `bg-nav` - Navigation background
- `--nav-foreground` / `text-nav-foreground` - Navigation text
- `--nav-hover` / `hover:bg-nav-hover` - Navigation hover state
- `--sidebar-bg` / `bg-sidebar` - Sidebar background
- `--sidebar-foreground` / `text-sidebar-foreground` - Sidebar text

### Gradient Colors
- `--gradient-from` - Gradient start
- `--gradient-via` - Gradient middle
- `--gradient-to` - Gradient end

## Theme Toggle Component Example

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
```

## Page Layout Example

```tsx
export default function Page() {
  return (
    <div className="min-h-screen gradient-blue-bg">
      {/* Navigation */}
      <nav className="nav-bar border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold nav-item">TechGuard AI</h1>
          <div className="flex gap-4">
            <a href="#" className="nav-item px-3 py-2 rounded">Dashboard</a>
            <a href="#" className="nav-item px-3 py-2 rounded">Settings</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="gradient-card gradient-card-hover p-6 rounded-lg">
          <h2 className="gradient-text text-2xl font-bold mb-4">
            Welcome to TechGuard AI
          </h2>
          <p className="gradient-text-muted">
            Your content here with theme-aware styling
          </p>

          <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
            Get Started
          </button>
        </div>
      </main>

      {/* Sidebar */}
      <aside className="sidebar fixed right-0 top-0 h-full w-64 p-4 border-l">
        <h3 className="font-bold mb-4">Quick Links</h3>
        <nav className="space-y-2">
          <a href="#" className="sidebar-item block px-3 py-2 rounded">Link 1</a>
          <a href="#" className="sidebar-item block px-3 py-2 rounded">Link 2</a>
          <a href="#" className="sidebar-item block px-3 py-2 rounded">Link 3</a>
        </nav>
      </aside>
    </div>
  )
}
```

## Best Practices

1. **Always use theme variables**: Never hardcode colors. Always use CSS variables or Tailwind classes that reference them.

2. **Component prominence**: Use `nav-*` and `sidebar-*` colors for navigation elements to ensure they stand out in both themes.

3. **Consistent spacing**: Use Tailwind's spacing utilities consistently across themes.

4. **Test both themes**: Always test your components in both dark and light modes to ensure readability.

5. **Hover states**: Use opacity changes or the predefined hover classes for interactive elements.

6. **Accessibility**: Ensure sufficient contrast ratios in both themes (the current scheme provides excellent contrast).

## Theme System Files

- `app/globals.css` - CSS variables and utility classes
- `tailwind.config.ts` - Tailwind theme configuration
- `app/components/providers/ThemeProvider.tsx` - Theme provider wrapper
- `app/layout.tsx` - Root layout with theme provider

## Migration Guide

If you have existing components with hardcoded colors:

### Before
```tsx
<div className="bg-blue-900 text-white">
  <button className="bg-cyan-400 text-black">Click</button>
</div>
```

### After
```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">Click</button>
</div>
```

Or use the semantic classes:

```tsx
<div className="gradient-blue-bg">
  <button className="bg-primary text-primary-foreground">Click</button>
</div>
```
