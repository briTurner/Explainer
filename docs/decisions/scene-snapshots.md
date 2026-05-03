# Scene Snapshots

Explainer currently favors complete scene snapshots over mutation-based scene transitions.

## Proposed Direction

Each [`Scene`](../reference/scene.md) should contain the information needed to render that scene directly.

A renderer may compare neighboring scenes to infer transitions, but it should not need to replay a mutation log to understand the current scene.

## Rationale

Snapshots keep the authoring model simple for agents and humans.

They also make individual scenes inspectable, linkable, and easier to validate.

## Open Questions

- Should optional authoring conveniences compile into canonical snapshots?
- Should a renderer be allowed to precompute continuity across the whole document?
- Should scene snapshots include enough data for offline rendering without artifact access?
