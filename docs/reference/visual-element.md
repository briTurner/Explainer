# VisualElement

`VisualElement` is an inspectable object in a scene visual.

Elements are generic visual shapes. Domain meaning comes from labels, narration, metadata, artifacts, and consistent authoring.

Element IDs are unique within their scene and entity kind. Reusing the same ID across neighboring scenes communicates continuity.

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

Generic visual shape.

V1 values: `rectangle`, `roundedRectangle`, `ellipse`, `circle`, `diamond`, `triangle`, `hexagon`, `cylinder`, `cloud`, `document`, `note`, `container`, `text`, `image`, `icon`, `table`, and `custom`.

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

Artifact references must resolve against artifacts in the same scene.

### metadata

Renderer- or domain-specific pass-through data.
