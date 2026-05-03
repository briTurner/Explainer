# Artifacts

Artifacts are supporting materials that accompany a scene. They connect an explanation to evidence: source code, line ranges, tests, generated files, charts, screenshots, documents, logs, traces, commits, pull requests, or external references.

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
type ArtifactLocator = {
  uri: string;
  range?: TextRange;
  symbol?: string;
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

## Design Role

Artifacts are the bridge between explanation and inspectable evidence.

The protocol should say what evidence is relevant, while renderers decide how to open, preview, highlight, or summarize it in their host environment.

## Reference

See [`Artifact`](../reference/artifact.md).

## Open Questions

- Should artifact references be scene-local only, or should documents support shared artifacts?
- Should artifact locators distinguish local project paths from external URLs?
- Should source ranges be one-based, zero-based, or host-defined?
