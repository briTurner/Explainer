# Stable IDs

## Status

Accepted.

## Context

Explainer uses complete scene snapshots. Stable IDs give renderers a simple mechanical way to preserve continuity across neighboring snapshots without adding an explicit transition language.

## Decision

IDs are scoped by scene and entity kind.

When the same ID appears in neighboring scenes for the same entity kind, the renderer treats it as the same entity. When an ID appears for the first time, the entity enters. When an ID disappears, the entity exits.

The protocol does not reserve ID prefixes in v1.

## Consequences

Stable IDs let the document express continuity without requiring an explicit transition language.

They also make visual elements, relationships, artifacts, and focus targets easier to inspect and link.

Renderer warnings for suspicious ID reuse are outside the protocol. Renderers mechanically interpret same-ID reuse as continuity.
