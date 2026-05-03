# VisualElement

`VisualElement` is an inspectable object in a scene visual.

Elements are generic visual shapes. Domain meaning comes from labels, narration, metadata, artifacts, and consistent authoring.

## Shape

```ts
type VisualElement = {
  id: string;
  kind: VisualElementKind;
  label?: string;
  description?: string;
  geometry?: Geometry;
  appearance?: Appearance;
  artifactRefs?: string[];
  metadata?: Record<string, unknown>;
};
```

## Fields

### id

Stable element identifier within the scene and, when appropriate, across neighboring scenes.

### kind

Generic visual shape, such as `rectangle`, `ellipse`, `cylinder`, `document`, `text`, `image`, or `custom`.

### label

Short visible label.

### description

Longer explanation of the element.

### geometry

Optional placement and size guidance.

### appearance

Optional presentation state such as tone, emphasis, variant, opacity, collapsed state, or badges.

### artifactRefs

IDs of scene artifacts associated with this visual element.

Type: references to [`Artifact`](artifact.md)

### metadata

Renderer- or domain-specific pass-through data.

## Open Questions

- Should `id` be unique only within a scene or within the full document?
- Which shape kinds belong in v1?
- Should artifact references be validated against scene-local artifacts only?
