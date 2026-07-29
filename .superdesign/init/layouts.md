# Shared Layouts

No product application shell exists yet.

`App.tsx` chooses between:

- the JAR-001 secure foundation page at the normal production root;
- the development specimen at `#/design-system`.

`showcase/Showcase.tsx` owns a development-only editorial-folio composition with a hero, numbered
sections, wide content boundary, optional fixed section rail, and responsive single-column
fallbacks. It must not be reused as the JAR-003 Presence shell.
