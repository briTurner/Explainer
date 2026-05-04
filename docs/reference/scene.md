# Scene

`Scene` is the canonical unit of explanation.

It is a complete snapshot of narration, visual state, supporting artifacts, focus, and within-scene animation.

A scene must include at least one of `narration` or `visual`. Artifacts are scene-local supporting evidence and are not sufficient by themselves to make a scene explanatory.

## Shape

```ts
type Scene = {
  id: string;
  title?: string;
  narration?: NarrationBlock;
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

Human-readable explanation for the scene.

Type: [`NarrationBlock`](narration-block.md)

### visual

Primary visual representation for the scene.

Type: [`Visual`](visual.md)

### artifacts

Scene-local supporting evidence attached to the scene.

Type: [`Artifact[]`](artifact.md)

### focus

Targets that identify the main subject of the scene.

Type: [`FocusTarget[]`](focus-target.md)

### animations

Within-scene motion, reveal, or emphasis.

Type: [`Animation[]`](animation.md)

## Constraints

- Scenes should be renderable without resolving a global entity registry.
- Any target referenced by `focus` should exist in the same scene's visual.
- Any animation target should refer to a visual element or relationship in the same scene.
- Everything inside a scene is scene-local.
- Scenes do not have declared prerequisites, learning objectives, or pedagogical purpose fields in v1.
