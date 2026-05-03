# VisualRelationship

`VisualRelationship` is a connector between two visual elements in a scene.

Relationships are scene-local facts. Their meaning comes from labels, narration, metadata, artifacts, and consistent authoring.

## Shape

```ts
type VisualRelationship = {
  id: string;
  from: string;
  to: string;
  label?: string;
  description?: string;
  path?: RelationshipPath;
  line?: LineAppearance;
  startDecoration?: RelationshipDecoration;
  endDecoration?: RelationshipDecoration;
  artifactRefs?: string[];
  metadata?: Record<string, unknown>;
};
```

## Fields

### id

Stable relationship identifier.

### from

Source visual element ID.

### to

Target visual element ID.

### label

Short visible label for the relationship.

### description

Longer explanation of the relationship.

### path

Path style such as `straight`, `curved`, or `orthogonal`.

### line

Line appearance such as pattern, weight, tone, or opacity.

### startDecoration

Decoration at the source end.

### endDecoration

Decoration at the target end.

### artifactRefs

IDs of scene artifacts associated with this relationship.

Type: references to [`Artifact`](artifact.md)

### metadata

Renderer- or domain-specific pass-through data.

## Open Questions

- Should relationship IDs be stable across scenes like element IDs?
- Should `from` and `to` require element IDs from the same scene?
- Should directional meaning be explicit or inferred from decoration?
