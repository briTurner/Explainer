# Scene

`Scene` is the canonical unit of explanation.

It is a complete snapshot of narration, visual state, supporting artifacts, focus, and within-scene animation.

## Shape

```ts
type Scene = {
  id: string;
  title?: string;
  narration?: NarrationBlock[];
  visual?: Visual;
  artifacts?: Artifact[];
  focus?: FocusTarget[];
  animations?: Animation[];
};
```

## Fields

### id

Stable scene identifier.

### title

Optional human-readable scene title.

### narration

Human-readable explanation blocks for the scene.

Type: [`NarrationBlock[]`](narration-block.md)

### visual

Primary visual representation for the scene.

Type: [`Visual`](visual.md)

### artifacts

Supporting evidence attached to the scene.

Type: [`Artifact[]`](artifact.md)

### focus

Targets that identify the main subject of the scene.

Type: [`FocusTarget[]`](focus-target.md)

### animations

Within-scene motion, reveal, or emphasis.

Type: [`Animation[]`](animation.md)

## Constraints

- Scenes should be renderable without resolving a global entity registry.
- Any element referenced by `focus` should exist in the same scene's visual.
- Any animation target should refer to a visual element or relationship in the same scene.

## Open Questions

- Should `title`, `narration`, or `visual` become required?
- Should artifacts be scene-local or document-level with scene references?
- Should a scene have a declared pedagogical purpose?
