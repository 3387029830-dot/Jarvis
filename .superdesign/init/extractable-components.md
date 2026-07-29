# Extractable Components

The reusable boundary is `apps/desktop/src/renderer/src/design-system/index.ts`.

Future product pages should consume the existing Button, IconButton, Panel, Card, Badge, Tooltip,
Dialog, ScrollArea, Spinner, and VisuallyHidden exports before introducing new primitives.

The showcase hero, section numbering, fixed specimen rail, token swatches, state table, and
evidence-query parsing are development documentation and must not be extracted into the JAR-003
product shell.
