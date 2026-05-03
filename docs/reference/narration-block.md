# NarrationBlock

`NarrationBlock` describes the human-readable explanation for a scene.

Narration should explain what the user is seeing and why it matters.

## Shape

```ts
type NarrationBlock =
  | TextNarration
  | MarkdownNarration
  | StepNarration;
```

## Variants

### TextNarration

Plain text narration.

```ts
type TextNarration = {
  kind: "text";
  text: string;
};
```

### MarkdownNarration

Markdown-formatted narration.

```ts
type MarkdownNarration = {
  kind: "markdown";
  markdown: string;
};
```

### StepNarration

Ordered or progressive explanation steps.

```ts
type StepNarration = {
  kind: "steps";
  steps: string[];
};
```

## Open Questions

- Should Markdown be allowed in all renderers?
- Should step narration support per-step focus or animation hooks?
- Should narration blocks support localization IDs?
