# Narration-Led Explanation

Not every explanation needs a diagram.

A narration-led scene can use text and supporting evidence without a primary visual.

Artifacts support the explanation, but they do not replace narration or visual explanation.

## Sketch

```yaml
schemaVersion: 0.1.0
metadata:
  title: Test Failure Triage
  domain: debugging
scenes:
  - id: failing-test
    title: The regression is visible in the parser test
    narration:
      - kind: text
        text: The failing assertion shows that escaped delimiters are being split as ordinary separators.
    artifacts:
      - id: parser-test
        kind: sourceFile
        title: Parser regression test
        locator:
          kind: workspacePath
          path: Tests/ParserTests.swift
          range:
            startLine: 42
            endLine: 58
      - id: test-output
        kind: log
        title: Test output
        locator:
          kind: workspacePath
          path: artifacts/test-output.log
```
