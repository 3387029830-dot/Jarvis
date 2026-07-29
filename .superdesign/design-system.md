# Jarvis Design-System Direction

## Product context

Jarvis is a voice-first personal cognition environment. It should feel like returning to a private
observatory for thought: calm, atmospheric, premium, spatial, intelligent, personal, and
continuous. It is not a dashboard, programming assistant, task manager, generic chat shell, neon
cyberpunk HUD, or MCU interface imitation.

JAR-002 creates only the shared visual language and a development showcase. It does not create the
Presence product page, Orb, voice behavior, conversations, cognition map, persistence, or provider
integration.

## Visual thesis — editorial observatory

The system combines the quiet hierarchy of an editorial reading room with the depth of a dark
observatory. Space comes primarily from luminance steps, generous negative space, thin borders,
soft occlusion shadows, and one restrained cold accent. Surfaces should feel like places where
thought can rest, not SaaS widgets.

The memorable characteristic is a subtle “horizon line”: fine structural rules and soft local light
suggest depth without grids, glowing frames, or decorative science-fiction chrome.

## Color direction

- Near-black graphite is dominant.
- Elevated surfaces move in small neutral-blue luminance steps.
- Text is warm-neutral white rather than stark white.
- One desaturated ice-blue accent is primary.
- Green, amber, and red are reserved for semantic states.
- Violet is not a primary accent and blue-purple gradients are prohibited.
- Glow is local, low-opacity, and never applied to every card.

## Typography direction

- UI and Chinese body text use the Windows-native `"Microsoft YaHei UI"` / `"Microsoft YaHei"`
  stack first, followed by a neutral system sans fallback. No network font is required.
- Latin interface labels may use the same sans stack; restrained uppercase tracking is limited to
  short metadata.
- Long-form reflection may use `"Iowan Old Style"`, `"STSong"`, `"Songti SC"`, or serif fallback,
  but only as an editorial accent.
- Chinese body copy targets a comfortable 1.75–1.9 line height with no artificial letter spacing.
- Mixed Chinese/Latin copy must preserve readable punctuation spacing and stable baselines.

## Spatial direction

- Use a deliberate spacing scale, not one-off values.
- Reading content widths stay near 42–68 characters; showcase sections can expand but should not
  become dense dashboard grids.
- Radius is quiet and architectural: mostly 8–18px, with pills reserved for badges.
- Cards are editorial containers with internal rhythm and optional heading rules.
- Nested cards are avoided unless the inner surface represents a true semantic layer.

## Interaction direction

- Hover changes luminance, border clarity, and at most 1px of translation.
- Active state contracts or deepens slightly; it never performs a decorative bounce.
- Keyboard focus uses a two-layer ring/offset treatment so it is visible beyond color alone.
- Loading preserves button width and exposes an accessible status.
- Error states pair color with iconography or text.
- Tooltip content is supplementary.
- Dialog uses a real modal layer, focus trapping, initial focus, return focus, and Escape close.

## Motion direction

- Micro feedback: 120–180ms.
- Component transitions: 220–320ms.
- Modal entry: 280–360ms.
- Use decelerating curves for entry and quicker curves for exit.
- Reduced motion removes translation, scale, blur transitions, and continuous motion while keeping
  instantaneous opacity/border/state feedback.

## Showcase direction

The development showcase should read as a specimen folio rather than a dashboard: one clear
editorial header, quiet section numbering, generous vertical rhythm, and carefully composed
component groups. It must show tokens, Chinese typography, interaction states, overflow,
Dialog/Tooltip behavior, and reduced-motion verification without resembling a product home page.
