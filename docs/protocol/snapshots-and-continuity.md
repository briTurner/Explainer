# Snapshots and Continuity

Explainer uses complete scene snapshots with stable IDs.

Each scene declares what should exist at that moment. When two neighboring scenes contain objects with the same stable ID, a renderer may treat them as the same conceptual object and preserve continuity.

## Inferred Transitions

The canonical v1 protocol does not define an explicit transition object.

A renderer should infer movement between scenes by comparing complete snapshots:

- Same ID in both scenes: preserve identity.
- Same ID with changed label, appearance, geometry, or metadata: update.
- ID only in previous scene: exit.
- ID only in current scene: enter.
- Same ID with changed geometry or viewport framing: move or zoom.

## Why Snapshots

Snapshots keep authoring simple. Agents do not have to author a second mutation language, and renderers do not have to replay every previous scene to understand the current one.

## Open Questions

- When should an ID be considered stable versus newly introduced?
- Should the protocol define optional transition hints later?
- Should relationships have the same continuity rules as visual elements?
