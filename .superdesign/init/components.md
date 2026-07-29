# Shared UI Components

JAR-002 primitives live in `apps/desktop/src/renderer/src/design-system/` and are exported from
`index.ts`.

- `Button`: primary, secondary, quiet, and danger variants; three sizes; disabled, loading, and
  error semantics.
- `IconButton`: requires an accessible name and supports the same semantic variants.
- `Panel`: section container with root, elevated, soft, and overlay tones.
- `Card`: editorial content container using the same surface tones.
- `Badge`: neutral, accent, success, warning, and danger tones.
- `Tooltip`: supplementary hover/focus content with `aria-describedby`.
- `Dialog`: native modal semantics plus initial focus, Tab wrapping, Escape close, backdrop close,
  and return focus.
- `ScrollArea`: named, keyboard-reachable overflow region.
- `Spinner` and `VisuallyHidden`: small support primitives used by interactive components.

Concrete token values live only in `design-system/tokens.css`; `tokens.ts` exports typed references
to those CSS variables.
