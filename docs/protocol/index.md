# Protocol Exploration

The Explainer protocol is a domain-neutral model for describing scene-based explanations.

This section is for exploring concepts, constraints, and open questions before the syntax is finalized.

## Layers

The protocol should be designed in three layers:

- **Conceptual model:** What an explanation is, what a scene means, how continuity works, and how artifacts connect to evidence.
- **Canonical contract:** The eventual machine-validatable shape of the protocol, likely represented with JSON Schema.
- **Authoring format:** The syntax humans and agents write directly, such as JSON, YAML, or a future convenience format.

## Key Constraint

Scenes are authoritative snapshots. A renderer should not need to resolve a document-level entity registry before it can render a scene.

Stable IDs across scenes imply continuity, but each scene should still contain the information needed to stand on its own.

## Primary Pages

- [Model](model.md) describes the top-level entities and their relationships.
- [Scenes](scenes.md) explains the scene as the unit of explanation.
- [Snapshots and Continuity](snapshots-and-continuity.md) explains stable IDs and inferred transitions.
- [Artifacts](artifacts.md) explains evidence binding.
- [Renderer Contract](renderer-contract.md) explains what renderers owe the protocol.
