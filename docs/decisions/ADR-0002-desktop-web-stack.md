# ADR-0002: Build a desktop application with Web UI technology

## Status

Accepted

## Decision

Use Electron as the desktop shell and React/TypeScript for the interface.

## Rationale

The product needs desktop presence, global shortcuts, microphone access, local persistence, system integration, and high visual iteration speed. Web UI technology provides a strong ecosystem for motion, typography, graph visualization, and Codex-assisted development.

## Consequences

- Security boundaries between main, preload, and renderer are mandatory.
- Performance must be measured, especially for WebGL and large graphs.
- The first release targets Windows desktop.
