# Renderers

A renderer consumes an `ExplanationDocument` and presents it to the user.

A renderer might be a standalone app, a web page, a VS Code extension, or another IDE integration. Renderers translate protocol intent into environment-specific behavior, such as opening a file or highlighting a line range.

## Renderer Responsibility

The protocol expresses what should be explained. The renderer decides how to make that explanation useful in its host environment.

For example, the same artifact locator could become:

- A clickable source link in a web renderer.
- An editor pane and highlighted range in a VS Code renderer.
- A document attachment in a mobile renderer.

## Available Renderers

- `renderers/web` is a dependency-free browser renderer for local inspection of Explainer JSON/YAML documents.
