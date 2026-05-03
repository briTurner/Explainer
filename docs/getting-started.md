# Getting Started

This documentation captures the initial Explainer protocol outline from the project README and expands it into a browsable structure.

The docs are intentionally model-first. We are using them to explore the protocol shape before freezing the canonical syntax.

## Local Preview

Install the documentation dependencies:

```bash
pip install -r requirements.txt
```

Run the local development server:

```bash
make docs-serve
```

Build the static site:

```bash
make docs-build
```

## Documentation Structure

- `protocol/` explores the conceptual model and unresolved design space.
- `reference/` documents individual protocol types and fields.
- `decisions/` records protocol design choices and their rationale.
- `examples/` shows complete and partial explanation documents.
- `renderers/` describes how host environments should consume the protocol.
- `generation/` captures guidance for agents that author explanation documents.
- `architecture/` explains the design principles and constraints.
- `roadmap/` tracks future work.

## Authoring Rule

Docs should explain intent and role first, then schema details. Protocol pages should prefer strict contracts and make invalid states hard to represent.

Reference pages should be inspectable: each type gets its own page, each field gets a stable heading, and references to other types should link to their pages.
