# Frontend and Visual Specification

## 1. Product visual thesis

The interface is a private cognitive observatory, not a dashboard, command center, or neon sci-fi HUD.

Keywords:

- calm;
- atmospheric;
- premium;
- spatial;
- intelligent;
- minimal but alive;
- personal;
- continuous.

Avoid:

- excessive cyberpunk neon;
- dense metrics;
- corporate sidebars full of tools;
- generic chat bubbles as the entire layout;
- decorative node graphs with no meaning;
- excessive glass blur and glowing borders.

## 2. Application shell

### Left rail

Use a compact icon-and-label rail:

- Presence
- Conversation
- Constellation
- Evolution
- Archive

Settings and provider status remain secondary at the bottom.

### Main canvas

The main canvas has a persistent atmospheric background and page-specific content. Page transitions should preserve spatial continuity.

### Context layer

A collapsible right context layer may show related concepts, active exploration, source references, or cognition candidates. It should not always be open.

## 3. Presence page

Required elements:

- semantic Orb;
- greeting based on actual saved state;
- push-to-talk affordance;
- active explorations;
- unresolved question;
- recent belief revision;
- “continue” action.

The page should remain useful with zero, one, or many saved explorations.

## 4. Conversation page

Layout:

- centered readable conversation column;
- Orb/state presence near the input region;
- transcript and response rendered as editorial blocks rather than oversized chat bubbles;
- related-domain chips or small nodes emerge beside relevant passages;
- cognition candidate appears as an inline reflection card;
- source and uncertainty details are available on demand.

Voice and text share the same conversation timeline.

## 5. Constellation page

The first version must be curated and readable:

- cluster by active exploration or domain;
- limit initial viewport node count;
- use meaningful node sizes and edge styles;
- support search and focus;
- show why two nodes are connected;
- animate graph changes after confirmed cognition events;
- provide list/detail fallback for accessibility.

Node types have distinct shape/texture, not random colors alone.

## 6. Evolution page

Focus on a small number of belief threads.

Each thread shows:

- original question;
- belief versions;
- trigger for each change;
- evidence/source;
- uncertainty;
- unresolved tension;
- current provisional view.

This page is closer to an editorial timeline than a project changelog.

## 7. Archive page

Support filtering by:

- exploration;
- question;
- domain;
- date;
- source type;
- confirmed/unconfirmed;
- exported/not exported.

Archive is not the visual center of the product.

## 8. Orb behavior

Orb states:

- idle: slow breathing and subtle internal motion;
- listening: responsive waveform/deformation;
- transcribing: controlled inward motion;
- understanding: layered orbit or refraction;
- responding: outward pulse synchronized with text stream;
- speaking: audio-reactive but restrained;
- interrupted: immediate clean contraction;
- error: brief desaturation and stable recovery cue.

Orb rendering may use React Three Fiber. It must have a reduced-motion and low-performance fallback.

## 9. Initial design tokens

```css
:root {
  --bg-root: #07090d;
  --bg-elevated: #0c1017;
  --bg-soft: #111722;
  --text-primary: #f1f4f8;
  --text-secondary: #9ba7b8;
  --text-muted: #687487;
  --border-subtle: rgba(170, 190, 220, 0.12);
  --accent-primary: #8fb7ff;
  --accent-cyan: #7de6df;
  --accent-violet: #b3a2ff;
  --danger: #ff8f9a;
  --success: #92dfbd;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
}
```

These are starting constraints, not a command to use all accent colors at once.

## 10. Typography

- Use a neutral modern sans-serif for UI.
- Use a readable serif or editorial face sparingly for long-form reflections if licensing and rendering permit.
- Chinese typography must be tested explicitly; do not assume Latin spacing works for Chinese.
- Maintain comfortable line length and line height for deep reading.

## 11. Motion

Suggested timing:

- micro feedback: 120–180 ms;
- component transitions: 220–360 ms;
- page spatial transitions: 360–600 ms;
- ambient Orb movement: continuous, slow, non-distracting.

Use motion curves consistently. Never block interaction while waiting for an animation.

## 12. Responsive scope

Foundation target:

- Windows desktop application;
- primary design width 1280–1920 px;
- usable minimum width 1024 px;
- no mobile layout in the foundation milestone.
