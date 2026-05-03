# Renderer Expectations

A renderer should:

- Render each scene as a complete snapshot.
- Interpret artifacts in a way that fits the renderer's environment.
- Use focus targets to direct user attention.
- Play scene animations when a scene becomes active.
- Infer continuity across neighboring scenes from stable IDs.
- Treat unknown metadata as pass-through data.
- Degrade gracefully when it does not support a visual kind, animation, artifact kind, or viewport mode.

## Graceful Degradation

Renderers are not required to support every visual kind or animation before the protocol is useful.

Unsupported features should degrade into understandable fallbacks, such as static diagrams, artifact lists, or narration-first views.
