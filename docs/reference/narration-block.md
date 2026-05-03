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

Renderers are not required to support rich Markdown rendering. A renderer may degrade Markdown narration to plain text.

```ts
type MarkdownNarration = {
  kind: "markdown";
  markdown: string;
};
```

### StepNarration

Text grouped as steps.

```ts
type StepNarration = {
  kind: "steps";
  steps: string[];
};
```

`StepNarration` does not support per-step focus, animation hooks, interaction state, or localization IDs in v1.
