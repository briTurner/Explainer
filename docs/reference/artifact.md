# Artifact

`Artifact` connects an explanation scene to supporting evidence.

Artifacts let renderers open, preview, highlight, or link to source files, documents, screenshots, traces, tests, commits, pull requests, URLs, and generated assets.

Artifacts are scene-local. Artifact IDs are unique within a scene and are referenced only by other scene-local values.

## Shape

```ts
type Artifact = {
  id: string;
  kind: ArtifactKind;
  title?: string;
  description?: string;
  locator: ArtifactLocator;
  metadata?: Record<string, unknown>;
};
```

## Fields

### id

Stable artifact identifier within the scene.

### kind

Artifact category, such as `sourceFile`, `textFile`, `document`, `image`, `video`, `log`, `trace`, `test`, `commit`, `pullRequest`, `url`, or `generated`.

### title

Human-readable title.

### description

Longer explanation of what the artifact proves or supports.

### locator

Location information for the artifact.

Artifact locators use explicit tagged variants so renderers do not have to infer whether a string is an absolute local file path, a local file URL, or an external URL.

```ts
type ArtifactLocator =
  | FilePathLocator
  | FileUrlLocator
  | ExternalUrlLocator;

type FilePathLocator = {
  kind: "filePath";
  path: string; // absolute local file path
  range?: TextRange;
  symbol?: string;
};

type FileUrlLocator = {
  kind: "fileUrl";
  url: string;
  range?: TextRange;
  symbol?: string;
};

type ExternalUrlLocator = {
  kind: "url";
  url: string;
  fragment?: string;
};

type TextRange = {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
};
```

`filePath.path` is an absolute local path. Use `fileUrl` only when the artifact is already represented as a file URI, and use `url` for external web resources.

Source ranges use one-based lines and columns.

### metadata

Renderer- or domain-specific pass-through data.
