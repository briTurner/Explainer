# VisualRelationship

`VisualRelationship` is a connector between two visual elements in a scene.

Relationships are scene-local facts. Their meaning comes from labels, narration, metadata, artifacts, and consistent authoring.

Relationship IDs are unique within their scene and entity kind. Reusing the same relationship ID across neighboring scenes communicates continuity.

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

Source visual element ID. This must reference a visual element in the same scene.

### to

Target visual element ID. This must reference a visual element in the same scene.

### label

Short visible label for the relationship.

### description

Longer explanation of the relationship.

### path

Path style such as `straight`, `curved`, or `orthogonal`.

### line

Line appearance such as pattern, weight, tone, or opacity.

### startDecoration

Decoration at the source end. Decorations are presentation, not the source of semantic direction.

### endDecoration

Decoration at the target end. Decorations are presentation, not the source of semantic direction.

### artifactRefs

IDs of scene artifacts associated with this relationship.

Type: references to [`Artifact`](artifact.md)

Artifact references must resolve against artifacts in the same scene.

### metadata

Renderer- or domain-specific pass-through data.

Directional meaning is explicit in the data through `from` and `to`.
