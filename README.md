# Explainer

Explainer is a protocol and rendering system for agent-authored explanations of complex systems. Its first major use case is codebase explanation, but the format is intentionally domain-neutral: the same explanation model should be able to explain software architecture, request flows, debugging paths, economic systems, organizational processes, or any other system made of concepts, relationships, artifacts, and state changes.

## Problem Statement

Agents can now write and modify large amounts of code quickly. That creates a new problem for software engineers: they can become guests in their own codebases, receiving finished changes without the mental model needed to confidently own, review, debug, or extend those systems.

Today, an agent can explain a codebase in prose, and sometimes with static Mermaid, UML, or sequence diagrams. That helps, but it still leaves the human doing the hard navigation work. If the explanation says that object A calls object B through protocol C, the human has to switch panes, search the codebase, open the right files, find the right lines, and manually connect the explanation to the implementation.

Explainer exists to make explanations interactive, synchronized, and inspectable. An agent should be able to produce a guided explanation where each scene can show narration, diagrams, highlights, animations, and accompanying artifacts such as source files, line ranges, commits, tests, traces, screenshots, charts, or documents.

## High-Level Solution

Explainer has three major pieces:

1. **Explanation protocol**
   A domain-neutral document format for describing scene-based explanations. The protocol defines narration, visuals, artifacts, focus, animations, and scene snapshots without coupling those concepts to a specific renderer or host environment.

2. **Renderer**
   A tool that consumes an `ExplanationDocument` and presents it to the user. A renderer might be a standalone app, a web page, a VS Code extension, or another IDE integration. Renderers translate protocol intent into environment-specific behavior, such as opening a file or highlighting a line range.

3. **Generation skill**
   Guidance for agents so they can reliably produce valid explanation documents. The skill teaches agents how to select scenes, choose visual forms, bind artifacts, and make explanations useful without requiring humans to hand-author the protocol.

The core design choice is that Explainer uses **scene snapshots with stable IDs**.

Each scene is a complete, self-contained snapshot of what should be shown at that moment. When two neighboring scenes contain elements with the same stable ID, the renderer may treat them as the same conceptual object and animate changes between them. If an element appears in a later scene with a new ID, it is new. If an element disappears, it exits.

This keeps authoring simple while still enabling continuity, zooming, state changes, and meaningful transitions.

## Core Principles

- **Scenes are self-contained.** A renderer should be able to render a scene without resolving a global entity registry.
- **Stable IDs imply continuity.** The same ID across scenes means the renderer can preserve identity and animate changes.
- **The protocol expresses intent, not host commands.** A scene can reference an artifact and focus a target, but it should not encode a VS Code command or browser-specific action.
- **The schema is domain-neutral.** The protocol should not include primitives like `cacheEntry`, `bankAccount`, or `ReactComponent`. Those are domain concepts expressed through labels, metadata, artifacts, and generic visual forms.
- **Scene transitions are inferred from snapshots.** A renderer decides how to move between scenes by comparing stable IDs, geometry, labels, appearance, and presence.
- **Animations happen inside a scene.** An animation describes motion, reveal, or emphasis after a scene is active.
- **Renderers may add default interactions.** If a visual element references an artifact, a renderer may let the user click the element to inspect that artifact. The core document does not need to declare every interaction.

## Explanation Document

An `ExplanationDocument` is an ordered set of scene snapshots.

```ts
type ExplanationDocument = {
  schemaVersion: string;
  metadata: DocumentMetadata;
  scenes: Scene[];
};
```

### Document Metadata

Document metadata describes the explanation as a whole.

```ts
type DocumentMetadata = {
  id?: string;
  title: string;
  description?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  domain?: string;
  tags?: string[];
};
```

`domain` is descriptive, not behavioral. Examples include `codebase`, `economics`, `debugging`, `architecture`, or `operations`.

## Scene

A `Scene` is the canonical unit of explanation. It is comparable to a slide, but more structured: it can include narration, visuals, supporting artifacts, focus targets, and within-scene animations.

```ts
type Scene = {
  id: string;
  title?: string;
  narration?: NarrationBlock[];
  visual?: Visual;
  artifacts?: Artifact[];
  focus?: FocusTarget[];
  animations?: Animation[];
};
```

Scenes should be complete snapshots. If a scene needs to show an entity, relationship, label, artifact, or visual state, that information should be present in the scene itself.

## Narration

Narration is the human-readable explanation for a scene. It should explain what the user is looking at and why it matters.

```ts
type NarrationBlock =
  | TextNarration
  | MarkdownNarration
  | StepNarration;

type TextNarration = {
  kind: "text";
  text: string;
};

type MarkdownNarration = {
  kind: "markdown";
  markdown: string;
};

type StepNarration = {
  kind: "steps";
  steps: string[];
};
```

Renderers may present narration as slide text, speaker notes, a side panel, captions, or progressive step text.

## Visuals

A `Visual` describes the primary visual representation for a scene. It does not need to be present on every scene; some explanations may be artifact-led and only use narration plus highlighted files or documents.

```ts
type Visual = {
  kind: VisualKind;
  layout?: Layout;
  viewport?: Viewport;
  elements: VisualElement[];
  relationships?: VisualRelationship[];
};

type VisualKind =
  | "uml"
  | "sequence"
  | "flow"
  | "graph"
  | "tree"
  | "timeline"
  | "table"
  | "freeform";
```

The visual kind tells the renderer how to interpret the scene's visual structure. The protocol can start with a limited subset and add more kinds over time.

### Visual Elements

Visual elements are generic visual shapes. They should not encode domain-specific concepts as primitive types. The agent author assigns meaning through labels, narration, metadata, artifacts, and visual consistency across scenes.

```ts
type VisualElement = {
  id: string;
  kind: VisualElementKind;
  label?: string;
  description?: string;
  geometry?: Geometry;
  appearance?: Appearance;
  artifactRefs?: string[];
  metadata?: Record<string, unknown>;
};

type VisualElementKind =
  | "rectangle"
  | "roundedRectangle"
  | "ellipse"
  | "circle"
  | "diamond"
  | "triangle"
  | "hexagon"
  | "cylinder"
  | "cloud"
  | "document"
  | "note"
  | "container"
  | "text"
  | "image"
  | "icon"
  | "table"
  | "custom";
```

Examples:

- In a code explanation, an agent might use `rectangle` for classes, `circle` for states, and `cylinder` for persistence.
- In a genealogy explanation, an agent might use `rectangle` for blood relatives and `circle` for married-in relatives.
- In an economics explanation, an agent might use `cylinder` for account ledgers and `diamond` for policy decisions.

The protocol supplies visual vocabulary. The explanation supplies domain meaning.

### Visual Relationships

Relationships are visual connectors between elements within a scene. Their meaning comes from labels, narration, metadata, artifacts, and the author's consistent visual choices.

```ts
type VisualRelationship = {
  id: string;
  from: string;
  to: string;
  label?: string;
  description?: string;
  path?: RelationshipPath;
  line?: LineAppearance;
  startDecoration?: RelationshipDecoration;
  endDecoration?: RelationshipDecoration;
  artifactRefs?: string[];
  metadata?: Record<string, unknown>;
};

type RelationshipPath =
  | "straight"
  | "curved"
  | "orthogonal";

type LineAppearance = {
  pattern?: "solid" | "dashed" | "dotted";
  weight?: "thin" | "regular" | "thick";
  tone?: "default" | "muted" | "primary" | "success" | "warning" | "danger";
  opacity?: number;
};

type RelationshipDecoration =
  | "none"
  | "arrow"
  | "circle"
  | "diamond"
  | "bar";
```

Relationships are scene-local facts. If ownership moves from Alice to Bob, one scene can show a connector from Alice to the asset and the next scene can show a connector from Bob to the asset. Stable IDs allow the renderer to infer continuity where appropriate, but the scene remains authoritative.

### Layout

Layout gives the renderer optional guidance without requiring pixel-perfect placement.

```ts
type Layout = {
  strategy?: "auto" | "layered" | "force" | "grid" | "timeline" | "manual";
  direction?: "leftToRight" | "rightToLeft" | "topToBottom" | "bottomToTop";
  bounds?: Rect;
};
```

If `strategy` is `manual`, elements may include geometry. Otherwise, geometry is advisory.

```ts
type Geometry = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

### Viewport

A viewport describes the part of the visual that should be in view for a scene. This lets an explanation preserve a large system layout while focusing the user's attention on a subsection.

```ts
type Viewport = {
  mode?: "fitAll" | "fitSelection" | "manual";
  targetIds?: string[];
  padding?: number;
  center?: Point;
  zoom?: number;
};

type Point = {
  x: number;
  y: number;
};
```

For example, a renderer can lay out a whole service graph, then use `viewport.targetIds` to zoom into the API and authentication service for one scene. Another renderer might interpret the same viewport as a selected region in a minimap or as a filtered mobile view.

### Appearance

Appearance describes presentation state in generic terms.

```ts
type Appearance = {
  tone?: "default" | "muted" | "primary" | "success" | "warning" | "danger";
  emphasis?: "none" | "low" | "medium" | "high";
  variant?: string;
  opacity?: number;
  collapsed?: boolean;
  badges?: string[];
};
```

Renderers decide how these values map to color, line weight, opacity, icons, labels, or animation.

## Artifacts

Artifacts are supporting materials that accompany a scene. They are how an explanation connects to real evidence: source code, line ranges, tests, generated files, charts, screenshots, documents, logs, traces, commits, pull requests, or external references.

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

Artifacts describe supporting information that belongs to the scene. The protocol does not specify how a renderer must present them. A VS Code renderer might navigate directly to a file and line range. A web renderer might show a link or side panel. A phone renderer might show an artifact list, while a tablet renderer might use split view.

### Artifact Locator

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

Examples:

```json
{
  "id": "auth-service-validation",
  "kind": "sourceFile",
  "title": "Token validation",
  "locator": {
    "uri": "Sources/Auth/AuthService.swift",
    "range": {
      "startLine": 42,
      "endLine": 61
    }
  }
}
```

```json
{
  "id": "debt-flow-chart",
  "kind": "image",
  "title": "Debt flow through the banking system",
  "locator": {
    "uri": "artifacts/debt-flow.png"
  }
}
```

## Focus

Focus identifies what the scene is mainly about. It is a simple attention mechanism, not a command system.

```ts
type FocusTarget = {
  element: string;
  role?: "primary" | "secondary" | "context";
  reason?: string;
};
```

`element` refers to a visual element ID in the same scene. Focus does not target artifacts; artifacts are supporting evidence, while focus identifies the visual entity currently being discussed.

Example:

```json
{
  "focus": [
    {
      "element": "auth-service",
      "role": "primary",
      "reason": "This object decides whether the request is allowed to continue."
    }
  ]
}
```

Renderers can use focus to spotlight, scroll, dim surrounding context, or select a visual element.

## Animations

Animations happen within a single scene after that scene is active.

```ts
type Animation = {
  id?: string;
  kind: AnimationKind;
  target: string;
  durationMs?: number;
  delayMs?: number;
  easing?: string;
  repeat?: number | "infinite";
  direction?: AnimationDirection;
  onComplete?: AnimationCompletion;
  metadata?: Record<string, unknown>;
};

type AnimationKind =
  | "reveal"
  | "hide"
  | "pulse"
  | "spotlight"
  | "tracePath"
  | "zoom"
  | "pan"
  | "expand"
  | "collapse"
  | "sequence";

type AnimationDirection =
  | "forward"
  | "reverse"
  | "alternate";

type AnimationCompletion =
  | "hold"
  | "reset";
```

Animations start automatically when their scene becomes active, after any `delayMs`. `repeat` controls whether they run once, a fixed number of times, or forever. `direction: "alternate"` supports animations that reverse and repeat. `onComplete` tells the renderer whether the final animated state should remain visible or reset to the scene's base snapshot.

Examples:

```json
{
  "animations": [
    {
      "kind": "tracePath",
      "target": "api-to-auth-service",
      "durationMs": 900,
      "onComplete": "hold"
    },
    {
      "kind": "pulse",
      "target": "auth-service",
      "durationMs": 600,
      "repeat": "infinite",
      "direction": "alternate"
    }
  ]
}
```

## Transitions

The canonical v1 protocol does not define an explicit transition object. A renderer should infer movement between scenes by comparing complete snapshots:

- Same ID in both scenes: preserve identity.
- Same ID with changed label, appearance, geometry, or metadata: update.
- ID only in previous scene: exit.
- ID only in current scene: enter.
- Same ID with changed geometry or viewport framing: move or zoom.

This keeps the document format simpler and avoids asking agents to author a second mutation language. If future renderer work proves that inference is not expressive enough, the protocol can add optional transition metadata later.

## Minimal Example

```json
{
  "schemaVersion": "0.1.0",
  "metadata": {
    "title": "Request Authentication Walkthrough",
    "domain": "codebase"
  },
  "scenes": [
    {
      "id": "request-enters-api",
      "title": "The request enters the API layer",
      "narration": [
        {
          "kind": "text",
          "text": "The request first reaches the API controller, which extracts the token before delegating validation."
        }
      ],
      "visual": {
        "kind": "sequence",
        "layout": {
          "strategy": "auto",
          "direction": "leftToRight"
        },
        "elements": [
          {
            "id": "client",
            "kind": "rectangle",
            "label": "Client"
          },
          {
            "id": "api-controller",
            "kind": "rectangle",
            "label": "API Controller",
            "artifactRefs": ["api-controller-source"]
          }
        ],
        "relationships": [
          {
            "id": "client-to-api",
            "from": "client",
            "to": "api-controller",
            "label": "GET /profile",
            "path": "straight",
            "endDecoration": "arrow",
            "line": {
              "pattern": "solid",
              "weight": "regular"
            }
          }
        ]
      },
      "artifacts": [
        {
          "id": "api-controller-source",
          "kind": "sourceFile",
          "title": "API controller request entry point",
          "locator": {
            "uri": "Sources/API/ProfileController.swift",
            "range": {
              "startLine": 18,
              "endLine": 31
            }
          }
        }
      ],
      "focus": [
        {
          "element": "api-controller",
          "role": "primary"
        }
      ],
      "animations": [
        {
          "kind": "tracePath",
          "target": "client-to-api",
          "durationMs": 700,
          "onComplete": "hold"
        }
      ]
    },
    {
      "id": "api-delegates-validation",
      "title": "The API delegates token validation",
      "narration": [
        {
          "kind": "text",
          "text": "The controller does not validate the token itself. It delegates that responsibility to the authentication service."
        }
      ],
      "visual": {
        "kind": "sequence",
        "elements": [
          {
            "id": "client",
            "kind": "rectangle",
            "label": "Client"
          },
          {
            "id": "api-controller",
            "kind": "rectangle",
            "label": "API Controller",
            "artifactRefs": ["api-controller-source"]
          },
          {
            "id": "auth-service",
            "kind": "rectangle",
            "label": "Auth Service",
            "artifactRefs": ["auth-service-source"]
          }
        ],
        "relationships": [
          {
            "id": "api-to-auth-service",
            "from": "api-controller",
            "to": "auth-service",
            "label": "validate(token)",
            "path": "straight",
            "endDecoration": "arrow",
            "line": {
              "pattern": "solid",
              "weight": "regular"
            }
          }
        ]
      },
      "artifacts": [
        {
          "id": "auth-service-source",
          "kind": "sourceFile",
          "title": "Token validation implementation",
          "locator": {
            "uri": "Sources/Auth/AuthService.swift",
            "range": {
              "startLine": 42,
              "endLine": 61
            }
          }
        }
      ],
      "focus": [
        {
          "element": "auth-service",
          "role": "primary"
        }
      ],
      "animations": [
        {
          "kind": "tracePath",
          "target": "api-to-auth-service",
          "durationMs": 900,
          "onComplete": "hold"
        }
      ]
    }
  ]
}
```

## Renderer Expectations

A renderer should:

- Render each scene as a complete snapshot.
- Interpret artifacts in a way that fits the renderer's environment.
- Use focus targets to direct user attention.
- Play scene animations when a scene becomes active.
- Infer continuity across neighboring scenes from stable IDs.
- Treat unknown metadata as pass-through data.
- Degrade gracefully when it does not support a visual kind, animation, artifact kind, or viewport mode.

## Non-Goals for the Canonical Protocol

- It should not encode environment-specific commands such as `openFileAtLine` or `vscode.executeCommand`.
- It should not require a document-level entity registry for scenes to render.
- It should not make domain-specific concepts first-class primitives.
- It should not require every scene to include a diagram.
- It should not require renderers to implement every visual kind before the protocol is useful.

## Future Work

Possible future layers include:

- A JSON Schema package for validation.
- A TypeScript package with canonical types.
- A reference web renderer.
- A VS Code renderer that maps artifacts to editor panes and line highlights.
- Agent generation guidance for codebase walkthroughs, change explanations, debugging explanations, and onboarding curricula.
- Optional authoring conveniences that compile down to canonical self-contained scene snapshots.
