# Renderer Contract

A renderer consumes an [`ExplanationDocument`](../reference/explanation-document.md) and presents it to the user.

The protocol expresses explanation intent. The renderer translates that intent into host-specific behavior.

## Non-Normative Responsibilities

Renderer compliance is not part of the v1 protocol definition. As non-normative guidance, a renderer should:

- Render each scene as a complete snapshot.
- Interpret artifacts in a way that fits the renderer's environment.
- Use focus targets to direct user attention.
- Play scene animations when a scene becomes active.
- Infer continuity across neighboring scenes from stable IDs.
- Treat unknown metadata as pass-through data.
- Degrade gracefully when it does not support a visual kind, animation, artifact kind, or viewport mode.
- Report unsupported visual kinds, animation kinds, artifact kinds, or locator kinds to users instead of silently dropping meaningful information.

## Host-Specific Behavior

The protocol should not encode commands such as `openFileAtLine` or `vscode.executeCommand`.

Instead, a scene can reference an artifact and focus a target. A VS Code renderer can translate that into editor panes and line highlights. A web renderer can translate it into links, panels, or previews.

Renderer capabilities are not part of the v1 protocol.
