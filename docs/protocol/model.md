# Model

Explainer models an explanation as an ordered sequence of scenes.

Each scene combines narration, visuals, artifacts, focus, and animation into one inspectable snapshot. The snapshot is the source of truth for what should be visible at that moment.

## Core Entities

- [`ExplanationDocument`](../reference/explanation-document.md) is the top-level container for metadata and ordered scenes.
- [`DocumentMetadata`](../reference/document-metadata.md) describes the explanation as a whole.
- [`Scene`](../reference/scene.md) is the canonical unit of explanation.
- [`NarrationBlock`](../reference/narration-block.md) explains what the user is seeing and why it matters.
- [`Visual`](../reference/visual.md) describes the primary visual representation for a scene.
- [`VisualElement`](../reference/visual-element.md) represents an inspectable object in a visual.
- [`VisualRelationship`](../reference/visual-relationship.md) represents a connector between visual elements.
- [`Artifact`](../reference/artifact.md) connects a scene to supporting evidence.
- [`FocusTarget`](../reference/focus-target.md) identifies the main subject of a scene.
- [`Animation`](../reference/animation.md) describes within-scene motion or emphasis.

## Working Assumption

The protocol model should be independent of its authoring syntax. JSON, YAML, and generated language bindings should all describe the same data model.

## Open Questions

- Which parts of the model should be required for a useful minimum document?
- Should the protocol define reusable authoring conveniences that compile into scene snapshots?
- Should examples be written in YAML for readability while the canonical contract is JSON Schema?
