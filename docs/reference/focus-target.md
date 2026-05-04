# FocusTarget

`FocusTarget` identifies what a scene is mainly about.

Focus is an attention mechanism, not a command system. Focus is only valid in scenes with visuals.

## Shape

```ts
type FocusTarget = {
  target: FocusTargetRef;
  role?: "primary" | "secondary" | "context";
  reason?: string;
};

type FocusTargetRef =
  | { kind: "element"; id: string }
  | { kind: "relationship"; id: string };
```

## Fields

### target

The visual entity receiving focus.

Type: reference to [`VisualElement`](visual-element.md) or [`VisualRelationship`](visual-relationship.md)

### role

The focus role: `primary`, `secondary`, or `context`.

Every focus target receives primary treatment unless `role` specifies otherwise.

### reason

Human-readable reason the element matters in this scene.

## Constraints

- `target` must refer to a visual element or visual relationship in the same scene.
- Focus should not target artifacts directly.
- Focus target array order is meaningless.
- Focus is not valid in scenes without visuals.
