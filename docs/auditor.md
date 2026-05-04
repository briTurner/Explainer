# Auditor

The Explainer auditor validates JSON or YAML files as Explainer documents.

It runs in two deterministic phases:

1. JSON Schema validation checks document structure, required fields, enum values, tagged unions, and scalar constraints.
2. Semantic validation checks rules that JSON Schema cannot express cleanly, such as ID uniqueness, references between scene-local entities, and local file path resolution.

## Usage

Validate a document:

```bash
.venv/bin/python tools/explainer_audit.py path/to/explainer.yaml
```

Emit machine-readable diagnostics:

```bash
.venv/bin/python tools/explainer_audit.py path/to/explainer.yaml --format json
```

Run the included valid fixture:

```bash
make audit-valid
```

Run the included invalid fixtures and print their expected diagnostics:

```bash
make audit-invalid
```

## Diagnostics

Each diagnostic includes:

- `code`: stable error category.
- `path`: JSON Pointer path to the failing value.
- `message`: what is wrong.
- `suggestion`: the next corrective action.

The auditor exits with `0` when the document is valid and `1` when validation fails.

## Semantic Checks

The auditor currently checks:

- duplicate scene IDs,
- duplicate visual element, relationship, artifact, and animation IDs within a scene,
- relationship endpoints reference same-scene visual elements,
- visual `artifactRefs` reference same-scene artifacts,
- focus targets reference same-scene visual elements or relationships,
- focus is not used without a visual,
- animation targets reference same-scene visual elements or relationships,
- viewport targets reference same-scene visual elements or relationships,
- `filePath` artifact locators use absolute local paths that exist on this machine,
- source ranges use valid ordering.
