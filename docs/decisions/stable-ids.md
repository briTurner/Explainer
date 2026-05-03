# Stable IDs

Stable IDs are how Explainer preserves conceptual continuity across scenes.

## Proposed Direction

When the same ID appears in neighboring scenes, the renderer may treat it as the same conceptual object.

When an ID appears for the first time, the object enters. When an ID disappears, the object exits.

## Rationale

Stable IDs let the document express continuity without requiring an explicit transition language.

They also make visual elements, relationships, artifacts, and focus targets easier to inspect and link.

## Open Questions

- Should IDs be globally unique across a document or scoped by object kind?
- Should the protocol reserve ID prefixes?
- Should renderers warn when reused IDs appear to represent different concepts?
