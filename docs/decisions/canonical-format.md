# Canonical Format

## Status

Accepted.

## Context

Explainer is a protocol, not a TypeScript library. The canonical shape should not be owned by one renderer or one implementation language.

The protocol needs a machine-validatable contract, but humans and agents also need readable examples while the model is still taking shape.

## Decision

- Use JSON Schema as the eventual canonical machine-validatable contract.
- Allow JSON as the canonical interchange format.
- Allow YAML as a human- and agent-friendly authoring format that maps to the same model.
- Generate language bindings from the contract where useful.
- Introduce the first JSON Schema soon, after the initial pass through protocol questions.
- Use YAML examples before and after the schema stabilizes when YAML is easier to read.

## Consequences

JSON Schema gives Explainer a neutral validation target. YAML gives authors a friendlier syntax without changing the underlying model.

Reference documentation should use both generated and hand-authored material: generated or schema-checked field/reference details, plus hand-authored conceptual explanation and rationale.
