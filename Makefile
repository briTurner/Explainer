.PHONY: docs-serve docs-build

docs-serve:
	NO_MKDOCS_2_WARNING=true .venv/bin/mkdocs serve

docs-build:
	NO_MKDOCS_2_WARNING=true .venv/bin/mkdocs build --strict
