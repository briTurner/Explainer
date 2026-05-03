# Generation

The generation skill is guidance for agents so they can reliably produce valid explanation documents.

It should teach agents how to:

- Select useful scenes.
- Choose visual forms.
- Bind artifacts to evidence.
- Use stable IDs consistently.
- Avoid domain-specific protocol extensions.
- Produce explanations that are useful without requiring humans to hand-author protocol objects.

## Initial Guidance

Agents should start from the user's task and choose the smallest set of scenes that creates a usable mental model.

Each scene should answer three questions:

- What is the user looking at?
- Why does it matter?
- What evidence supports it?
