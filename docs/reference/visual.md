# Visual

`Visual` describes the primary visual representation for a scene.

Some explanations may omit visuals and rely on narration plus artifacts.

## Shape

```ts
type Visual = {
  kind: VisualKind;
  layout?: Layout;
  viewport?: Viewport;
  elements: VisualElement[];
  relationships?: VisualRelationship[];
};
```

## Fields

### kind

The visual form the renderer should use as interpretation guidance.

Current candidate values: `uml`, `sequence`, `flow`, `graph`, `tree`, `timeline`, `table`, `freeform`.

### layout

Optional layout guidance such as automatic, layered, force, grid, timeline, or manual placement.

### viewport

Optional framing guidance for the visible region of the scene.

### elements

Visual objects in the scene.

Type: [`VisualElement[]`](visual-element.md)

### relationships

Visual connectors between elements.

Type: [`VisualRelationship[]`](visual-relationship.md)

## Open Questions

- Which visual kinds belong in v1?
- Should `elements` be required to be non-empty?
- Should layout and viewport be split into separate reference types?
