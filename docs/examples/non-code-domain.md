# Non-Code Domain

Explainer is intended to be domain-neutral.

This sketch uses the same scene, visual, artifact, and focus concepts to explain a business process.

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
      - kind: text
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
      - element: manager-review
        role: primary
```

## Open Questions

- Which visual kinds are sufficiently domain-neutral?
- Should examples define domain-specific conventions outside the protocol?
- Should metadata support domain-specific vocabularies?
