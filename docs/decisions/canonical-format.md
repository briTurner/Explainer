# Canonical Format

The current recommendation is to separate the protocol model from its authoring syntax.

## Proposed Direction

- Use JSON Schema as the eventual canonical machine-validatable contract.
- Allow JSON as the canonical interchange format.
- Allow YAML as a human- and agent-friendly authoring format that maps to the same model.
- Generate language bindings from the contract where useful.

## Rationale

Explainer is a protocol, not a TypeScript library. The canonical shape should not be owned by one renderer or one implementation language.

JSON Schema gives us a neutral validation target. YAML gives authors a friendlier syntax while the model is still being explored.

## Open Questions

- When should the first schema be introduced?
- Should examples prefer YAML before the schema stabilizes?
- Should generated reference pages come from JSON Schema, hand-authored docs, or both?
