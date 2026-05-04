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
- `default-document.js` embeds the default document shown at startup.
- `renderer.js` contains the protocol-aware rendering and validation logic.
- `server.mjs` serves the renderer and local artifact preview endpoint.
- `styles.css` defines the web presentation.

## Local Artifacts

Documents should use `filePath` locators with absolute local paths for source
files, logs, images, and other local evidence. The renderer preserves those
paths when creating artifact links and previews. Browser security still controls
whether a `file://` artifact can be fetched directly from the page's current
execution context.

When using the renderer over `http://`, start the local renderer server instead
of a generic static server:

```bash
node renderers/web/server.mjs
```

The server binds to `127.0.0.1` by default, serves the static renderer, and
exposes `/__explainer_artifact` so inline previews can read absolute local
artifact paths. Generic static servers can still show artifact links, but they
cannot satisfy inline local-file previews.

## Usage

Open `renderers/web/index.html` in a browser. The page can render the built-in
sample immediately, or you can load/paste a document.

For HTTP usage with local artifact previews:

```bash
make web-renderer
```

Then open `http://127.0.0.1:8787/`.

JSON is parsed with `JSON.parse`. YAML support is intentionally conservative and
covers the plain mapping/list/scalar style used by the repository fixtures. For
complex YAML authoring features, convert to canonical JSON before loading.
