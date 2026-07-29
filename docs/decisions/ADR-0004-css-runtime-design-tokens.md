# ADR-0004: Use CSS variables as the design-token runtime source

## Status

Accepted

## Decision

Keep all concrete Jarvis design-token values in renderer CSS custom properties. TypeScript may
export typed references such as `var(--color-accent)`, but it must not duplicate token values.

Build the JAR-002 primitives directly with React and browser semantics instead of adopting a
component framework. Use the native modal-dialog behavior as the base for focus containment,
Escape handling, and assistive-technology semantics, with explicit initial- and return-focus
behavior around it.

## Rationale

Jarvis needs one theme source that can respond to media preferences and future runtime changes
without synchronizing a JavaScript theme object with CSS. The first vertical slice also needs a
small, legible component surface rather than a third-party visual language that would be difficult
to separate from the product identity.

## Consequences

- Theme values remain inspectable and overridable in Chromium at runtime.
- TypeScript helpers point to CSS variables and provide naming assistance, not a second value set.
- Component state styling stays close to the renderer and does not expand the preload API.
- The project owns accessibility tests and maintenance for these primitives.
- A component framework may be reconsidered only if a later vertical slice documents capabilities
  that the current primitives cannot reasonably provide.
