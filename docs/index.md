# Explainer

Explainer is a protocol and rendering system for agent-authored explanations of complex systems.

Its first major use case is codebase explanation, but the format is intentionally domain-neutral. The same explanation model should be able to explain software architecture, request flows, debugging paths, economic systems, organizational processes, or any other system made of concepts, relationships, artifacts, and state changes.

## Problem

Agents can now write and modify large amounts of code quickly. That creates a new problem for software engineers: they can become guests in their own codebases, receiving finished changes without the mental model needed to confidently own, review, debug, or extend those systems.

Traditional prose explanations and static diagrams help, but they leave the human doing too much navigation work. If an explanation says that object A calls object B through protocol C, the human still has to search the codebase, open files, find lines, and connect the explanation to implementation details manually.

## Solution

Explainer exists to make explanations interactive, synchronized, and inspectable.

An agent should be able to produce a guided explanation where each scene can show narration, diagrams, highlights, animations, and accompanying artifacts such as source files, line ranges, commits, tests, traces, screenshots, charts, or documents.

## Major Pieces

Explainer has three major pieces:

- **Explanation protocol:** A domain-neutral document format for scene-based explanations.
- **Renderer:** A tool that consumes an `ExplanationDocument` and presents it to the user.
- **Generation skill:** Agent guidance for producing valid, useful explanation documents.

## Documentation Map

This documentation is split into two complementary modes:

- **Protocol exploration** explains the broader model, unresolved design questions, and renderer implications.
- **Reference pages** document one protocol type at a time, including fields, constraints, examples, and open questions.

The current priority is to clarify the model before freezing a concrete syntax. JSON, YAML, and generated language bindings can all represent the same underlying protocol once the contract stabilizes.

## Design Center

The core design choice is that Explainer uses scene snapshots with stable IDs.

Each scene is a complete, self-contained snapshot of what should be shown at that moment. When two neighboring scenes contain elements with the same stable ID, the renderer may treat them as the same conceptual object and animate changes between them.
