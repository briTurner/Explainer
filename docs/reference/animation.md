# Animation

`Animation` describes motion, reveal, or emphasis after a scene is active.

Animations should clarify attention or state change. They should not carry information that is missing from the base scene snapshot.

Animation targets may be visual elements or visual relationships. Animation sequences are flat in v1.

## Shape

```ts
type Animation = {
  id?: string;
  kind: AnimationKind;
  target: AnimationTarget;
  durationMs?: number;
  delayMs?: number;
  easing?: string;
  repeat?: number | "infinite";
  direction?: AnimationDirection;
  onComplete?: AnimationCompletion;
  metadata?: Record<string, unknown>;
};

type AnimationTarget =
  | { kind: "element"; id: string }
  | { kind: "relationship"; id: string };
```

## Fields

### id

Optional animation identifier.

### kind

Animation behavior, such as `reveal`, `hide`, `pulse`, `spotlight`, `tracePath`, `zoom`, `pan`, `expand`, `collapse`, or `sequence`.

`sequence` represents a flat ordered animation sequence in v1.

### target

The visual element or relationship being animated.

### durationMs

Animation duration in milliseconds.

### delayMs

Delay before the animation starts.

### easing

Renderer-specific or agreed easing name.

### repeat

Number of repeats or `infinite`.

### direction

Animation direction: `forward`, `reverse`, or `alternate`.

### onComplete

Completion behavior: `hold` or `reset`.

### metadata

Renderer- or domain-specific pass-through data.

Reduced-motion fallbacks are renderer behavior and are not part of the v1 protocol.
