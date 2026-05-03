# Explainer Web Renderer

This package is a dependency-free browser renderer for v1 Explainer documents.
It is intentionally small: open `index.html` directly, paste or load a JSON/YAML
document, and step through the document's scene snapshots.

## Role

The renderer consumes an `ExplanationDocument` and presents:

- document metadata and ordered scenes,
- `text`, `markdown`, and `steps` narration blocks,
- all current visual kinds through SVG layout strategies,
- all current visual element kinds,
- visual relationships with path, line, and decoration options,
- artifacts, locators, ranges, and metadata,
- focus targets, viewport intent, and within-scene animations,
- pass-through metadata for inspection.

Unsupported future protocol values are surfaced in the diagnostics panel instead
of being silently dropped.

## Files

- `index.html` hosts the renderer and document input controls.
- `renderer.js` contains the protocol-aware rendering and validation logic.
- `styles.css` defines the web presentation.

## Usage

Open `renderers/web/index.html` in a browser. The page can render the built-in
sample immediately, or you can load/paste a document.

JSON is parsed with `JSON.parse`. YAML support is intentionally conservative and
covers the plain mapping/list/scalar style used by the repository fixtures. For
complex YAML authoring features, convert to canonical JSON before loading.
