# Page Dependency Trees

## `/` — Foundation

- `main.tsx`
  - global token/component styles
  - `App.tsx`
    - `Foundation`
    - typed `window.jarvis.healthCheck()`

## `#/design-system` — Development showcase

- `main.tsx`
  - `design-system/tokens.css`
  - `design-system/components.css`
  - `showcase/showcase.css`
  - `App.tsx`
    - `showcase/Showcase.tsx`
      - all exported design-system primitives
      - URL-hash evidence options for Dialog, focus, and reduced motion

The showcase is validation content only and is not a Presence or product page.
