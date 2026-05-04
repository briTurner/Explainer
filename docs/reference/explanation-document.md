# ExplanationDocument

`ExplanationDocument` is the top-level protocol object.

It identifies the schema version, describes the explanation, and contains the ordered non-empty list of scenes.

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

### metadata

The document-level metadata.

Type: [`DocumentMetadata`](document-metadata.md)

### scenes

The ordered scene snapshots that make up the explanation. `scenes` must contain at least one [`Scene`](scene.md).

Type: [`Scene[]`](scene.md)

## Constraints

- `scenes` should preserve authorial order.
- A renderer should be able to navigate directly to any scene.
- The document should not require a global entity registry for scene rendering.
- Document IDs are optional in the core protocol. Systems that persist or share documents may require IDs at their own boundaries.
- The canonical interchange format may be JSON while documentation and authoring examples use YAML for readability.
