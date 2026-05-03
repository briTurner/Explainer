# ExplanationDocument

`ExplanationDocument` is the top-level protocol object.

It identifies the schema version, describes the explanation, and contains the ordered list of scenes.

## Shape

```ts
type ExplanationDocument = {
  schemaVersion: string;
  metadata: DocumentMetadata;
  scenes: Scene[];
};
```

## Fields

### schemaVersion

The protocol schema version used by the document.

Open question: should this follow semver before the first schema package exists?

### metadata

The document-level metadata.

Type: [`DocumentMetadata`](document-metadata.md)

### scenes

The ordered scene snapshots that make up the explanation.

Type: [`Scene[]`](scene.md)

## Constraints

- `scenes` should preserve authorial order.
- A renderer should be able to navigate directly to any scene.
- The document should not require a global entity registry for scene rendering.

## Open Questions

- Should a document require at least one scene?
- Should document IDs be required for persisted or shareable explanations?
- Should the canonical interchange format be JSON while authoring examples use YAML?
