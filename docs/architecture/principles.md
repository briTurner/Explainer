# Principles

Explainer's protocol design follows these principles:

- **Scenes are self-contained.** A renderer should be able to render a scene without resolving a global entity registry.
- **Stable IDs imply continuity.** The same ID across scenes means the renderer can preserve identity and animate changes.
- **The protocol expresses intent, not host commands.** A scene can reference an artifact and focus a target, but it should not encode a VS Code command or browser-specific action.
- **The schema is domain-neutral.** Domain concepts are expressed through labels, metadata, artifacts, and generic visual forms.
- **Scene transitions are inferred from snapshots.** A renderer decides how to move between scenes by comparing stable IDs, geometry, labels, appearance, and presence.
- **Animations happen inside a scene.** An animation describes motion, reveal, or emphasis after a scene is active.
- **Renderers may add default interactions.** If a visual element references an artifact, a renderer may let the user click the element to inspect that artifact.
