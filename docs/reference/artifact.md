# Artifact

`Artifact` connects an explanation scene to supporting evidence.

Artifacts let renderers open, preview, highlight, or link to source files, documents, screenshots, traces, tests, commits, pull requests, URLs, and generated assets.

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

Candidate shape:

```ts
type ArtifactLocator = {
  uri: string;
  range?: TextRange;
  symbol?: string;
  fragment?: string;
};
```

### metadata

Renderer- or domain-specific pass-through data.

## Open Questions

- Should artifact IDs be scene-local or document-global?
- Should source code locations model files, symbols, and ranges as distinct locator variants?
- Should the protocol define URI schemes for workspace-relative paths?
