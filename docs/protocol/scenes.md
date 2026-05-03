# Scenes

A `Scene` is the canonical unit of explanation. It is comparable to a slide, but more structured: it can include narration, visuals, supporting artifacts, focus targets, and within-scene animations.

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

Scenes should be complete snapshots. If a scene needs to show an entity, relationship, label, artifact, or visual state, that information should be present in the scene itself.

## Design Role

Scenes are the unit renderers navigate between, compare, animate, and inspect.

A scene should answer:

- What is the user looking at?
- Why does it matter?
- What evidence supports it?

## Authoring Guidance

Prefer a small number of meaningful scenes over many tiny steps. A scene should represent a stable explanatory state, not every animation frame or implementation detail.

Narration and artifacts should support the visual, but a scene does not have to include a visual. Some explanations may be artifact-led.

## Reference

See [`Scene`](../reference/scene.md) and [`NarrationBlock`](../reference/narration-block.md).

## Open Questions

- Should scenes require a title?
- Should narration be required, or can artifact-led scenes omit it?
- Should scenes support explicit prerequisites or learning objectives?

## Legacy Type Sketch

Narration is the human-readable explanation for a scene. It should explain what the user is looking at and why it matters.

```ts
type NarrationBlock =
  | TextNarration
  | MarkdownNarration
  | StepNarration;

type TextNarration = {
  kind: "text";
  text: string;
};

type MarkdownNarration = {
  kind: "markdown";
  markdown: string;
};

type StepNarration = {
  kind: "steps";
  steps: string[];
};
```

Renderers may present narration as slide text, speaker notes, a side panel, captions, or progressive step text.
