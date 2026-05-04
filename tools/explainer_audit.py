#!/usr/bin/env python3
"""Validate Explainer documents from the command line."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCHEMA_PATH = REPO_ROOT / "schema" / "explainer.schema.json"


def reexec_project_venv() -> None:
    """Use the project virtualenv for direct script invocation when available."""

    venv_python = REPO_ROOT / ".venv" / "bin" / "python"
    venv_root = REPO_ROOT / ".venv"
    if not venv_python.exists():
        return
    if Path(sys.prefix).resolve() == venv_root.resolve():
        return
    if os.environ.get("EXPLAINER_AUDIT_NO_VENV") == "1":
        return
    os.execv(str(venv_python), [str(venv_python), *sys.argv])


reexec_project_venv()

import jsonschema
import yaml


@dataclass(frozen=True)
class Diagnostic:
    """A deterministic validation diagnostic emitted by the auditor."""

    code: str
    path: str
    message: str
    suggestion: str
    severity: str = "error"

    def as_dict(self) -> dict[str, str]:
        return {
            "severity": self.severity,
            "code": self.code,
            "path": self.path,
            "message": self.message,
            "suggestion": self.suggestion,
        }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate a JSON or YAML file as an Explainer document."
    )
    parser.add_argument("document", type=Path, help="Path to the Explainer JSON/YAML file.")
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA_PATH,
        help=f"Path to the Explainer JSON Schema. Defaults to {DEFAULT_SCHEMA_PATH}.",
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format for validation results.",
    )
    args = parser.parse_args()

    diagnostics: list[Diagnostic] = []

    try:
        document = load_data(args.document)
    except ValueError as error:
        diagnostics.append(
            Diagnostic(
                code="parse_error",
                path="/",
                message=str(error),
                suggestion="Fix the file syntax or use a supported .json, .yaml, or .yml file.",
            )
        )
        return emit_result(args.document, diagnostics, args.format)

    try:
        schema = load_json(args.schema)
    except ValueError as error:
        diagnostics.append(
            Diagnostic(
                code="schema_load_error",
                path="/",
                message=str(error),
                suggestion="Verify the schema path points to a readable JSON Schema file.",
            )
        )
        return emit_result(args.document, diagnostics, args.format)

    diagnostics.extend(validate_schema(document, schema))
    if not diagnostics:
        diagnostics.extend(validate_semantics(document))

    return emit_result(args.document, diagnostics, args.format)


def load_data(path: Path) -> Any:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as error:
        raise ValueError(f"Could not read {path}: {error}") from error

    suffix = path.suffix.lower()
    try:
        if suffix == ".json":
            return json.loads(raw)
        if suffix in {".yaml", ".yml"}:
            return yaml.safe_load(raw)
    except (json.JSONDecodeError, yaml.YAMLError) as error:
        raise ValueError(f"Could not parse {path}: {error}") from error

    raise ValueError(f"Unsupported file extension for {path}.")


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not load schema {path}: {error}") from error


def validate_schema(document: Any, schema: dict[str, Any]) -> list[Diagnostic]:
    validator_cls = jsonschema.validators.validator_for(schema)
    validator_cls.check_schema(schema)
    validator = validator_cls(schema, format_checker=jsonschema.FormatChecker())

    diagnostics: list[Diagnostic] = []
    for error in sorted(validator.iter_errors(document), key=lambda item: list(item.path)):
        diagnostics.append(
            Diagnostic(
                code="schema_validation_error",
                path=json_pointer(error.absolute_path),
                message=clean_schema_message(error),
                suggestion=schema_suggestion(error),
            )
        )
    return diagnostics


def validate_semantics(document: Any) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []

    scenes = document.get("scenes", [])
    scene_ids: set[str] = set()
    for scene_index, scene in enumerate(scenes):
        scene_path = f"/scenes/{scene_index}"
        scene_id = scene.get("id")
        if scene_id in scene_ids:
            diagnostics.append(
                Diagnostic(
                    code="duplicate_scene_id",
                    path=f"{scene_path}/id",
                    message=f"Scene id {scene_id!r} is used more than once.",
                    suggestion="Use a unique scene id for each scene.",
                )
            )
        scene_ids.add(scene_id)

        visual = scene.get("visual")
        artifacts = scene.get("artifacts", [])
        artifact_ids = collect_ids(
            artifacts,
            f"{scene_path}/artifacts",
            "artifact",
            diagnostics,
        )

        if visual is None:
            if scene.get("focus"):
                diagnostics.append(
                    Diagnostic(
                        code="focus_without_visual",
                        path=f"{scene_path}/focus",
                        message="Scene has focus targets but no visual.",
                        suggestion="Remove focus or add a visual with matching focus targets.",
                    )
                )
            if scene.get("animations"):
                diagnostics.append(
                    Diagnostic(
                        code="animation_without_visual",
                        path=f"{scene_path}/animations",
                        message="Scene has animations but no visual.",
                        suggestion="Remove animations or add a visual with matching animation targets.",
                    )
                )
            validate_artifact_file_paths(artifacts, f"{scene_path}/artifacts", diagnostics)
            validate_artifact_ranges(artifacts, f"{scene_path}/artifacts", diagnostics)
            continue

        elements = visual.get("elements", [])
        relationships = visual.get("relationships", [])
        element_ids = collect_ids(
            elements,
            f"{scene_path}/visual/elements",
            "visual element",
            diagnostics,
        )
        relationship_ids = collect_ids(
            relationships,
            f"{scene_path}/visual/relationships",
            "visual relationship",
            diagnostics,
        )

        validate_artifact_refs(
            elements,
            f"{scene_path}/visual/elements",
            artifact_ids,
            diagnostics,
        )
        validate_artifact_refs(
            relationships,
            f"{scene_path}/visual/relationships",
            artifact_ids,
            diagnostics,
        )
        validate_relationships(
            relationships,
            f"{scene_path}/visual/relationships",
            element_ids,
            diagnostics,
        )
        validate_focus(
            scene.get("focus", []),
            f"{scene_path}/focus",
            element_ids,
            relationship_ids,
            diagnostics,
        )
        validate_animations(
            scene.get("animations", []),
            f"{scene_path}/animations",
            element_ids,
            relationship_ids,
            diagnostics,
        )
        validate_viewport_targets(
            visual.get("viewport"),
            f"{scene_path}/visual/viewport",
            element_ids,
            relationship_ids,
            diagnostics,
        )
        validate_artifact_file_paths(artifacts, f"{scene_path}/artifacts", diagnostics)
        validate_artifact_ranges(artifacts, f"{scene_path}/artifacts", diagnostics)

    return diagnostics


def collect_ids(
    items: Iterable[dict[str, Any]],
    path: str,
    noun: str,
    diagnostics: list[Diagnostic],
) -> set[str]:
    ids: set[str] = set()
    for index, item in enumerate(items):
        item_id = item.get("id")
        if item_id in ids:
            diagnostics.append(
                Diagnostic(
                    code="duplicate_id",
                    path=f"{path}/{index}/id",
                    message=f"Duplicate {noun} id {item_id!r} in the same scene.",
                    suggestion=f"Use a unique {noun} id within the scene.",
                )
            )
        ids.add(item_id)
    return ids


def validate_artifact_refs(
    items: Iterable[dict[str, Any]],
    path: str,
    artifact_ids: set[str],
    diagnostics: list[Diagnostic],
) -> None:
    for item_index, item in enumerate(items):
        for ref_index, artifact_ref in enumerate(item.get("artifactRefs", [])):
            if artifact_ref not in artifact_ids:
                diagnostics.append(
                    Diagnostic(
                        code="missing_artifact_ref",
                        path=f"{path}/{item_index}/artifactRefs/{ref_index}",
                        message=f"Artifact reference {artifact_ref!r} does not match a same-scene artifact.",
                        suggestion="Add an artifact with this id to the scene, or update the reference.",
                    )
                )


def validate_relationships(
    relationships: Iterable[dict[str, Any]],
    path: str,
    element_ids: set[str],
    diagnostics: list[Diagnostic],
) -> None:
    for index, relationship in enumerate(relationships):
        for field in ("from", "to"):
            target = relationship.get(field)
            if target not in element_ids:
                diagnostics.append(
                    Diagnostic(
                        code="missing_relationship_endpoint",
                        path=f"{path}/{index}/{field}",
                        message=f"Relationship {field!r} endpoint {target!r} does not match a same-scene visual element.",
                        suggestion="Use the id of a visual element from this scene.",
                    )
                )


def validate_focus(
    focus_targets: Iterable[dict[str, Any]],
    path: str,
    element_ids: set[str],
    relationship_ids: set[str],
    diagnostics: list[Diagnostic],
) -> None:
    for index, focus in enumerate(focus_targets):
        target = focus.get("target", {})
        validate_entity_ref(
            target,
            f"{path}/{index}/target",
            element_ids,
            relationship_ids,
            diagnostics,
            code="missing_focus_target",
            message_prefix="Focus target",
        )


def validate_animations(
    animations: Iterable[dict[str, Any]],
    path: str,
    element_ids: set[str],
    relationship_ids: set[str],
    diagnostics: list[Diagnostic],
) -> None:
    animation_ids = collect_optional_ids(animations, path, "animation", diagnostics)
    for index, animation in enumerate(animations):
        target = animation.get("target", {})
        validate_entity_ref(
            target,
            f"{path}/{index}/target",
            element_ids,
            relationship_ids,
            diagnostics,
            code="missing_animation_target",
            message_prefix="Animation target",
        )
        if animation.get("kind") == "sequence" and "sequence" not in animation:
            # The current schema keeps animation sequences flat but does not yet
            # define sequence members. This warning stays out of the schema until
            # sequence structure is settled.
            continue
    _ = animation_ids


def collect_optional_ids(
    items: Iterable[dict[str, Any]],
    path: str,
    noun: str,
    diagnostics: list[Diagnostic],
) -> set[str]:
    ids: set[str] = set()
    for index, item in enumerate(items):
        item_id = item.get("id")
        if item_id is None:
            continue
        if item_id in ids:
            diagnostics.append(
                Diagnostic(
                    code="duplicate_id",
                    path=f"{path}/{index}/id",
                    message=f"Duplicate {noun} id {item_id!r} in the same scene.",
                    suggestion=f"Use a unique {noun} id within the scene or omit optional ids.",
                )
            )
        ids.add(item_id)
    return ids


def validate_viewport_targets(
    viewport: dict[str, Any] | None,
    path: str,
    element_ids: set[str],
    relationship_ids: set[str],
    diagnostics: list[Diagnostic],
) -> None:
    if viewport is None:
        return
    for index, target_id in enumerate(viewport.get("targetIds", [])):
        if target_id not in element_ids and target_id not in relationship_ids:
            diagnostics.append(
                Diagnostic(
                    code="missing_viewport_target",
                    path=f"{path}/targetIds/{index}",
                    message=f"Viewport target {target_id!r} does not match a same-scene visual element or relationship.",
                    suggestion="Use a visual element or relationship id from this scene.",
                )
            )


def validate_artifact_ranges(
    artifacts: Iterable[dict[str, Any]],
    path: str,
    diagnostics: list[Diagnostic],
) -> None:
    for artifact_index, artifact in enumerate(artifacts):
        locator = artifact.get("locator", {})
        text_range = locator.get("range")
        if text_range is None:
            continue
        range_path = f"{path}/{artifact_index}/locator/range"
        start_line = text_range.get("startLine")
        end_line = text_range.get("endLine")
        start_column = text_range.get("startColumn")
        end_column = text_range.get("endColumn")

        if start_line > end_line:
            diagnostics.append(
                Diagnostic(
                    code="invalid_text_range",
                    path=range_path,
                    message=f"Text range starts on line {start_line} after it ends on line {end_line}.",
                    suggestion="Set startLine less than or equal to endLine.",
                )
            )
        if (
            start_line == end_line
            and start_column is not None
            and end_column is not None
            and start_column > end_column
        ):
            diagnostics.append(
                Diagnostic(
                    code="invalid_text_range",
                    path=range_path,
                    message=f"Text range starts at column {start_column} after it ends at column {end_column}.",
                    suggestion="Set startColumn less than or equal to endColumn when both columns are on the same line.",
                )
            )


def validate_artifact_file_paths(
    artifacts: Iterable[dict[str, Any]],
    path: str,
    diagnostics: list[Diagnostic],
) -> None:
    for artifact_index, artifact in enumerate(artifacts):
        locator = artifact.get("locator", {})
        if locator.get("kind") != "filePath":
            continue

        raw_path = locator.get("path", "")
        locator_path = f"{path}/{artifact_index}/locator/path"
        file_path = Path(raw_path)

        if not file_path.is_absolute():
            diagnostics.append(
                Diagnostic(
                    code="relative_file_path",
                    path=locator_path,
                    message=f"Local artifact path {raw_path!r} is relative.",
                    suggestion="Use an absolute local file path so renderers and agents can resolve the artifact without workspace context.",
                )
            )
            continue

        if not file_path.exists():
            diagnostics.append(
                Diagnostic(
                    code="missing_file_path",
                    path=locator_path,
                    message=f"Local artifact path {raw_path!r} does not exist on this machine.",
                    suggestion="Point the artifact at an existing local file or remove the artifact if the evidence is unavailable.",
                )
            )


def validate_entity_ref(
    target: dict[str, Any],
    path: str,
    element_ids: set[str],
    relationship_ids: set[str],
    diagnostics: list[Diagnostic],
    code: str,
    message_prefix: str,
) -> None:
    target_kind = target.get("kind")
    target_id = target.get("id")
    if target_kind == "element":
        valid = target_id in element_ids
        noun = "visual element"
    elif target_kind == "relationship":
        valid = target_id in relationship_ids
        noun = "visual relationship"
    else:
        return

    if not valid:
        diagnostics.append(
            Diagnostic(
                code=code,
                path=f"{path}/id",
                message=f"{message_prefix} {target_id!r} does not match a same-scene {noun}.",
                suggestion=f"Use the id of a {noun} from this scene.",
            )
        )


def emit_result(path: Path, diagnostics: list[Diagnostic], output_format: str) -> int:
    valid = not diagnostics
    if output_format == "json":
        payload = {
            "valid": valid,
            "path": str(path),
            "errorCount": len(diagnostics),
            "errors": [diagnostic.as_dict() for diagnostic in diagnostics],
        }
        print(json.dumps(payload, indent=2))
    elif valid:
        print(f"PASS {path} is a valid Explainer document.")
    else:
        print(f"FAIL {path} is not a valid Explainer document.")
        print(f"{len(diagnostics)} error(s):")
        for diagnostic in diagnostics:
            print(f"- [{diagnostic.code}] {diagnostic.path}")
            print(f"  {diagnostic.message}")
            print(f"  Fix: {diagnostic.suggestion}")
    return 0 if valid else 1


def json_pointer(path: Iterable[Any]) -> str:
    parts = [escape_pointer_part(part) for part in path]
    return "/" + "/".join(parts) if parts else "/"


def escape_pointer_part(part: Any) -> str:
    return str(part).replace("~", "~0").replace("/", "~1")


def clean_schema_message(error: jsonschema.ValidationError) -> str:
    if error.validator == "anyOf" and list(error.absolute_path)[:1] == ["scenes"]:
        return "Scene must include at least one of 'narration' or 'visual'."
    if list(error.absolute_path)[-1:] == ["narration"]:
        return "Scene narration must be a single NarrationBlock object."
    return error.message


def schema_suggestion(error: jsonschema.ValidationError) -> str:
    validator = error.validator
    if validator == "required":
        missing = ", ".join(repr(item) for item in error.validator_value)
        return f"Add the required field(s): {missing}."
    if validator == "additionalProperties":
        return "Remove unsupported fields or add them to the protocol schema intentionally."
    if validator in {"enum", "const"}:
        return "Use one of the allowed protocol values for this field."
    if validator == "minItems":
        return "Provide at least the minimum number of required items."
    if validator == "minimum":
        return "Use a value greater than or equal to the documented minimum."
    if validator == "format":
        return "Use the documented string format for this field."
    if validator in {"oneOf", "anyOf"}:
        if validator == "anyOf" and list(error.absolute_path)[:1] == ["scenes"]:
            return "Add narration or visual to the scene. Artifacts alone are supporting evidence, not an explanation."
        if list(error.absolute_path)[-1:] == ["narration"]:
            return "Use one NarrationBlock object, not an array of narration blocks."
        return "Make the value match exactly one valid protocol variant."
    return "Update this value to match the Explainer JSON Schema."


if __name__ == "__main__":
    sys.exit(main())
