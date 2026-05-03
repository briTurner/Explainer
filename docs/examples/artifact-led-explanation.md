# Artifact-Led Explanation

Not every explanation needs a diagram.

An artifact-led scene can use narration, focus, and supporting evidence without a primary visual.

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
          uri: Tests/ParserTests.swift
          range:
            startLine: 42
            endLine: 58
      - id: test-output
        kind: log
        title: Test output
        locator:
          uri: artifacts/test-output.log
```

## Open Questions

- Should focus be allowed when no visual exists?
- Should artifact-led scenes have a first-class primary artifact?
- Should renderers have a standard artifact layout for this case?
