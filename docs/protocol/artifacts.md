# Artifacts

Artifacts are supporting materials that accompany a scene. They connect an explanation to evidence: source code, line ranges, tests, generated files, charts, screenshots, documents, logs, traces, commits, pull requests, or external references.

Artifacts are scene-local. Scenes are discrete, self-contained snapshots, and the v1 protocol does not introduce shared document-level resources or entities. Artifact references from visual elements and relationships resolve against artifacts in the same scene.

```ts
type Artifact = {
  id: string;
  kind: ArtifactKind;
  title?: string;
  description?: string;
  locator: ArtifactLocator;
  metadata?: Record<string, unknown>;
};

type ArtifactKind =
  | "sourceFile"
  | "textFile"
  | "document"
  | "image"
  | "video"
  | "log"
  | "trace"
  | "test"
  | "commit"
  | "pullRequest"
  | "url"
  | "generated";
```

## Locator

```ts
type ArtifactLocator =
  | WorkspacePathLocator
  | FileUrlLocator
  | ExternalUrlLocator;

type WorkspacePathLocator = {
  kind: "workspacePath";
  path: string;
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

The protocol does not specify how a renderer must present artifacts. A VS Code renderer might navigate directly to a file and line range. A web renderer might show a link or side panel.

Artifact locators use explicit tagged variants so renderers do not have to infer whether a string is workspace-relative, a local file URL, or an external URL. Source ranges use one-based lines and columns.

## Design Role

Artifacts are the bridge between explanation and inspectable evidence.

The protocol should say what evidence is relevant, while renderers decide how to open, preview, highlight, or summarize it in their host environment.

## Reference

See [`Artifact`](../reference/artifact.md).
