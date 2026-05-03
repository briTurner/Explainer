# Non-Goals

The canonical protocol should not:

- Encode environment-specific commands such as `openFileAtLine` or `vscode.executeCommand`.
- Require a document-level entity registry for scenes to render.
- Make domain-specific concepts first-class primitives.
- Require every scene to include a diagram.
- Require renderers to implement every visual kind before the protocol is useful.

These constraints keep the protocol focused on durable explanation intent rather than one renderer's interaction model.
