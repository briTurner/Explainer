.PHONY: docs-serve docs-build audit-valid audit-invalid web-renderer

docs-serve:
	NO_MKDOCS_2_WARNING=true .venv/bin/mkdocs serve

docs-build:
	NO_MKDOCS_2_WARNING=true .venv/bin/mkdocs build --strict

audit-valid:
	.venv/bin/python tools/explainer_audit.py tests/fixtures/valid-explainer.yaml

audit-invalid:
	.venv/bin/python tools/explainer_audit.py tests/fixtures/invalid-schema-explainer.yaml || true
	.venv/bin/python tools/explainer_audit.py tests/fixtures/invalid-semantic-explainer.yaml || true

web-renderer:
	node renderers/web/server.mjs
