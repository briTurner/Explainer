# Visual

`Visual` describes the primary visual representation for a scene.

Some explanations may omit visuals and rely on narration plus artifacts. If a scene includes `visual`, then `visual.elements` must be non-empty.

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

V1 values: `sequence`, `flow`, `graph`, `tree`, `timeline`, `table`, `freeform`.

`uml` is not a v1 visual kind. UML can be treated as a style, convention, or future specialized form rather than a single generic visual structure.

### layout

Optional layout guidance such as automatic, layered, force, grid, timeline, or manual placement.

### viewport

Optional framing guidance for the visible region of the scene.

### elements

Non-empty list of visual objects in the scene.

Type: [`VisualElement[]`](visual-element.md)

### relationships

Visual connectors between elements.

Type: [`VisualRelationship[]`](visual-relationship.md)

`layout` and `viewport` are nested structured values inside `Visual`; they should also be documented as separate reference types as the schema matures.
