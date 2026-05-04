# Scene Snapshots

## Status

Accepted.

## Context

Explainer needs scenes to be inspectable and independently renderable. A mutation-based model would require renderers to replay previous state before understanding the current scene.

## Decision

Each [`Scene`](../reference/scene.md) should contain the information needed to render that scene directly.

A renderer may compare neighboring scenes to infer transitions, but it should not need to replay a mutation log to understand the current scene.

Optional authoring conveniences live outside the canonical protocol and compile into canonical self-contained scene snapshots.

## Consequences

Snapshots keep the authoring model simple for agents and humans.

They also make individual scenes inspectable, linkable, and easier to validate.

A renderer may precompute continuity across the whole document as an implementation detail. The protocol does not require or forbid it.

Scene snapshots include enough data to render narration, visual, focus, and animation state without fetching artifact contents. Artifact contents may remain external and unavailable offline; artifacts are evidence references, not required embedded payloads.
