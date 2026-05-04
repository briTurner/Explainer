# Minimal Example

This example shows a two-scene codebase explanation.

This JSON form is illustrative, not yet a frozen canonical syntax. During protocol exploration, examples may use YAML when it is easier to read.

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
            "endDecoration": "arrow"
          }
        ]
      },
      "artifacts": [
        {
          "id": "api-controller-source",
          "kind": "sourceFile",
          "title": "API controller request entry point",
          "locator": {
            "kind": "filePath",
            "path": "/Users/example/project/Sources/API/ProfileController.swift",
            "range": {
              "startLine": 18,
              "endLine": 31
            }
          }
        }
      ],
      "focus": [
        {
          "target": {
            "kind": "element",
            "id": "api-controller"
          },
          "role": "primary"
        }
      ],
      "animations": [
        {
          "kind": "tracePath",
          "target": {
            "kind": "relationship",
            "id": "client-to-api"
          },
          "durationMs": 700,
          "onComplete": "hold"
        }
      ]
    }
  ]
}
```

Additional examples should show renderer fallbacks, narration-led scenes with artifacts, non-code domains, and invalid-state prevention.
