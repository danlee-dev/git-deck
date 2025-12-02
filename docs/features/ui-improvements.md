# UI Improvements

Various UI fixes and improvements for visual consistency.

## 1. Footer Redesign

### Before

- Full-width background box
- GitHub icon
- Multiple wrapper divs
- More visual weight

### After

- No background (transparent)
- Text-only with separator
- Minimal structure
- Lighter visual presence

### Implementation

```tsx
// frontend/src/components/layout/Footer.tsx
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex-shrink-0 py-3">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-github-gray-500 dark:text-github-gray-500">
        <span>&copy; {currentYear} GitDeck</span>
        <span className="text-github-gray-300 dark:text-github-gray-600">|</span>
        <Link href="/profile" className="hover:text-github-gray-700 dark:hover:text-github-gray-300 transition-colors">
          Editor
        </Link>
        <Link href="/settings" className="hover:text-github-gray-700 dark:hover:text-github-gray-300 transition-colors">
          Settings
        </Link>
        <a href="https://github.com/danlee-dev" target="_blank" rel="noopener noreferrer" ...>
          GitHub
        </a>
        <a href="https://github.com/danlee-dev/git-deck/issues" target="_blank" rel="noopener noreferrer" ...>
          Feedback
        </a>
      </div>
    </footer>
  );
}
```

### Changes

- Removed `bg-github-gray-50 dark:bg-github-gray-900` background
- Removed GitHub icon import
- Simplified to single-line flex layout
- Added `|` separator between copyright and links
- Changed padding from `pt-1 pb-3` to `py-3`

## 2. MyPage Background Color Fix

### Problem

MyPage had a visible dark blue box around content, different from dashboard background.

### Root Cause

Color mismatch:
- Dashboard layout: `bg-github-gray-50 dark:bg-github-gray-900` (#24292e in dark mode)
- MyPage: `bg-gray-50 dark:bg-gray-900` (#111827 in dark mode)

The difference in hex values created a visible contrast.

### Solution

Changed MyPage to use consistent GitHub colors:

```tsx
// frontend/src/app/(dashboard)/mypage/page.tsx

// Before
<div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">

// After
<div className="h-full overflow-auto bg-github-gray-50 dark:bg-github-gray-900">
```

### Color Reference

| Color Name | Light | Dark |
|------------|-------|------|
| github-gray-50 | #f6f8fa | - |
| github-gray-900 | - | #24292e |
| gray-50 (Tailwind) | #f9fafb | - |
| gray-900 (Tailwind) | - | #111827 |

### Custom Colors in Tailwind

These colors are defined in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      'github-gray': {
        50: '#f6f8fa',
        100: '#eaeef2',
        // ...
        900: '#24292e',
      },
    },
  },
},
```

## 3. Chart Card Alignment

### Problem

Two chart cards had misaligned headers and x-axis labels.

### Solution

Fixed height for header row:

```tsx
// Before
<div className="flex items-baseline justify-between mb-2">

// After
<div className="flex items-center justify-between h-5 mb-1">
```

Changes:
- `items-baseline` -> `items-center`: Vertical centering
- Added `h-5`: Fixed height (20px)
- `mb-2` -> `mb-1`: Reduced margin

## 4. Chart Card Size

### Problem

Chart cards were too tall, taking up too much vertical space.

### Solution

Reduced heights and padding:

```tsx
// Container
// Before: px-4 py-3
// After: px-3 py-2.5

// Chart height
// Before: height={100}
// After: height={72}

// Loading state
// Before: h-[100px]
// After: h-[72px]
```

## Summary of Files Changed

| File | Change |
|------|--------|
| `Footer.tsx` | Removed background, simplified structure |
| `mypage/page.tsx` | Fixed background color class |
| `StatsCharts.tsx` | Fixed alignment, reduced sizes |

## Design Principles Applied

1. **Consistency**: Use same color tokens throughout
2. **Minimalism**: Remove unnecessary visual elements
3. **Alignment**: Fixed heights for consistent layouts
4. **Compactness**: Reduce padding where appropriate
