# Snapshots and Continuity

Explainer uses complete scene snapshots with stable IDs.

Each scene declares what should exist at that moment. Identity continuity is mechanical: if an entity in one scene has the same ID as an entity of the same kind in the previous scene, the renderer treats it as the same entity.

Choosing whether to reuse an ID is an authoring and generation concern. The protocol does not decide whether two similar entities should share identity; it only defines what same-ID reuse means.

## Inferred Transitions

The canonical v1 protocol does not define an explicit transition object.

A renderer should infer movement between scenes by comparing complete snapshots:

- Same ID in both scenes: preserve identity.
- Same ID with changed label, appearance, geometry, or metadata: update.
- ID only in previous scene: exit.
- ID only in current scene: enter.
- Same ID with changed geometry or viewport framing: move or zoom.
- Relationships follow the same same-ID continuity rule as visual elements.

## Why Snapshots

Snapshots keep authoring simple. Agents do not have to author a second mutation language, and renderers do not have to replay every previous scene to understand the current one.

The v1 protocol does not include optional transition hints.
