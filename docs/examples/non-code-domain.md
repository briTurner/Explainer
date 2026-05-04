# Non-Code Domain

Explainer is intended to be domain-neutral.

This sketch uses the same scene, visual, artifact, and focus concepts to explain a business process.

Examples may describe domain-specific conventions in prose, but those conventions are not protocol primitives. Metadata domain vocabulary remains descriptive guidance, not protocol behavior.

## Sketch

```yaml
schemaVersion: 0.1.0
metadata:
  title: Refund Approval Flow
  domain: operations
scenes:
  - id: refund-request-created
    title: A refund request enters review
    narration:
      kind: text
      text: A support agent creates a refund request, which moves into manager review when the refund exceeds the automatic approval threshold.
    visual:
      kind: flow
      elements:
        - id: support-agent
          kind: rectangle
          label: Support Agent
        - id: refund-request
          kind: document
          label: Refund Request
        - id: manager-review
          kind: diamond
          label: Manager Review
      relationships:
        - id: agent-creates-request
          from: support-agent
          to: refund-request
          label: creates
        - id: request-enters-review
          from: refund-request
          to: manager-review
          label: over threshold
    focus:
      - target:
          kind: element
          id: manager-review
        role: primary
```
