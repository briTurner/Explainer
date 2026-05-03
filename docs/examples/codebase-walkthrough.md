# Codebase Walkthrough

This example sketches an explanation for a request authentication path.

It uses a sequence visual, source-file artifacts, focus targets, and trace-path animation.

## Sketch

```yaml
schemaVersion: 0.1.0
metadata:
  title: Request Authentication Walkthrough
  domain: codebase
scenes:
  - id: request-enters-api
    title: The request enters the API layer
    narration:
      - kind: text
        text: The request reaches the API controller, which extracts the token before delegating validation.
    visual:
      kind: sequence
      elements:
        - id: client
          kind: rectangle
          label: Client
        - id: api-controller
          kind: rectangle
          label: API Controller
          artifactRefs:
            - api-controller-source
      relationships:
        - id: client-to-api
          from: client
          to: api-controller
          label: GET /profile
          endDecoration: arrow
    artifacts:
      - id: api-controller-source
        kind: sourceFile
        title: API controller request entry point
        locator:
          uri: Sources/API/ProfileController.swift
          range:
            startLine: 18
            endLine: 31
    focus:
      - element: api-controller
        role: primary
```

## Open Questions

- Should codebase examples require source ranges?
- Should agent-authored examples include confidence or evidence quality?
- Should renderer-specific examples live here or under renderer docs?
