# FocusTarget

`FocusTarget` identifies what a scene is mainly about.

Focus is an attention mechanism, not a command system.

## Shape

```ts
type FocusTarget = {
  element: string;
  role?: "primary" | "secondary" | "context";
  reason?: string;
};
```

## Fields

### element

The visual element ID receiving focus.

Type: reference to [`VisualElement`](visual-element.md)

### role

The focus role: `primary`, `secondary`, or `context`.

### reason

Human-readable reason the element matters in this scene.

## Constraints

- `element` should refer to a visual element in the same scene.
- Focus should not target artifacts directly.

## Open Questions

- Should focus support relationships as well as elements?
- Should focus ordering matter?
- Should focus be allowed in scenes without visuals?
