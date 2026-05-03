# Architecture

Explainer separates protocol intent from renderer behavior.

The protocol describes explanation state. Renderers interpret that state in a host environment. Generation guidance helps agents create valid documents without requiring users to understand every protocol detail.

## Components

- **Protocol:** The strict, domain-neutral contract.
- **Renderer:** A host-specific presentation and interaction layer.
- **Generation guidance:** Authoring rules and heuristics for agents.
- **Reference packages:** Future schema and type packages that encode the protocol contract.

## Architectural Bias

Business rules and protocol semantics should live outside UI/rendering code. A new renderer should not need to duplicate protocol logic to remain correct.
