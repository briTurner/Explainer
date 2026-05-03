(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  const SAMPLE_DOCUMENT = {
    schemaVersion: "0.1.0",
    metadata: {
      title: "Request Authentication Walkthrough",
      description: "A compact sample showing narration, visual structure, focus, artifacts, and animation.",
      domain: "codebase",
      tags: ["sample", "web-renderer"]
    },
    scenes: [
      {
        id: "request-enters-api",
        title: "The request enters the API layer",
        narration: [
          {
            kind: "text",
            text: "The request reaches the API controller, which extracts the token before delegating validation."
          },
          {
            kind: "steps",
            steps: ["Client sends GET /profile.", "Controller reads the bearer token.", "Validation moves to the auth service."]
          }
        ],
        visual: {
          kind: "sequence",
          layout: { direction: "leftToRight" },
          elements: [
            { id: "client", kind: "rectangle", label: "Client", appearance: { tone: "primary" } },
            {
              id: "api-controller",
              kind: "roundedRectangle",
              label: "API Controller",
              artifactRefs: ["api-controller-source"],
              appearance: { emphasis: "high", badges: ["source"] }
            },
            { id: "auth-service", kind: "hexagon", label: "Auth Service" }
          ],
          relationships: [
            { id: "client-to-api", from: "client", to: "api-controller", label: "GET /profile", endDecoration: "arrow" },
            {
              id: "api-to-auth",
              from: "api-controller",
              to: "auth-service",
              label: "validate(token)",
              path: "curved",
              line: { tone: "primary", weight: "thick" },
              endDecoration: "arrow"
            }
          ]
        },
        artifacts: [
          {
            id: "api-controller-source",
            kind: "sourceFile",
            title: "API controller request entry point",
            locator: {
              kind: "workspacePath",
              path: "Sources/API/ProfileController.swift",
              range: { startLine: 18, endLine: 31 }
            }
          }
        ],
        focus: [
          {
            target: { kind: "element", id: "api-controller" },
            role: "primary",
            reason: "This object bridges transport concerns and authentication business rules."
          }
        ],
        animations: [
          {
            kind: "tracePath",
            target: { kind: "relationship", id: "client-to-api" },
            durationMs: 700,
            onComplete: "hold"
          },
          {
            kind: "pulse",
            target: { kind: "element", id: "api-controller" },
            durationMs: 900,
            repeat: 2,
            direction: "alternate"
          }
        ]
      }
    ]
  };

  const PROTOCOL = {
    visualKinds: new Set(["sequence", "flow", "graph", "tree", "timeline", "table", "freeform"]),
    elementKinds: new Set([
      "rectangle",
      "roundedRectangle",
      "ellipse",
      "circle",
      "diamond",
      "triangle",
      "hexagon",
      "cylinder",
      "cloud",
      "document",
      "note",
      "container",
      "text",
      "image",
      "icon",
      "table",
      "custom"
    ]),
    narrationKinds: new Set(["text", "markdown", "steps"]),
    artifactKinds: new Set([
      "sourceFile",
      "textFile",
      "document",
      "image",
      "video",
      "log",
      "trace",
      "test",
      "commit",
      "pullRequest",
      "url",
      "generated"
    ]),
    locatorKinds: new Set(["workspacePath", "fileUrl", "url"]),
    animationKinds: new Set(["reveal", "hide", "pulse", "spotlight", "tracePath", "zoom", "pan", "expand", "collapse", "sequence"])
  };

  class ExplainerWebRenderer {
    constructor(root = document) {
      this.root = root;
      this.document = null;
      this.sceneIndex = 0;
      this.selected = null;
      this.diagnostics = [];
      this.elementsById = new Map();
      this.relationshipsById = new Map();
      this.positionsById = new Map();
      this.bindDom();
      this.bindEvents();
      this.loadDocument(SAMPLE_DOCUMENT);
    }

    bindDom() {
      const ids = [
        "document-title",
        "document-description",
        "document-tags",
        "scene-list",
        "previous-scene",
        "next-scene",
        "scene-counter",
        "document-file",
        "load-sample",
        "toggle-input",
        "input-panel",
        "document-input",
        "render-input",
        "scene-kicker",
        "scene-title",
        "visual-stage",
        "narration-panel",
        "artifact-panel",
        "focus-panel",
        "selection-panel",
        "diagnostic-panel"
      ];
      this.dom = Object.fromEntries(ids.map((id) => [id, this.root.getElementById(id)]));
    }

    bindEvents() {
      this.dom["previous-scene"].addEventListener("click", () => this.goToScene(this.sceneIndex - 1));
      this.dom["next-scene"].addEventListener("click", () => this.goToScene(this.sceneIndex + 1));
      this.dom["load-sample"].addEventListener("click", () => this.loadDocument(SAMPLE_DOCUMENT));
      this.dom["toggle-input"].addEventListener("click", () => {
        this.dom["input-panel"].hidden = !this.dom["input-panel"].hidden;
      });
      this.dom["render-input"].addEventListener("click", () => this.loadText(this.dom["document-input"].value, "pasted document"));
      this.dom["document-file"].addEventListener("change", (event) => this.loadFile(event));
      document.addEventListener("keydown", (event) => {
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) {
          return;
        }
        if (event.key === "ArrowLeft") {
          this.goToScene(this.sceneIndex - 1);
        }
        if (event.key === "ArrowRight") {
          this.goToScene(this.sceneIndex + 1);
        }
      });
    }

    async loadFile(event) {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      const text = await file.text();
      this.loadText(text, file.name);
    }

    loadText(text, sourceName) {
      try {
        const documentObject = parseDocumentText(text);
        this.loadDocument(documentObject);
      } catch (error) {
        this.document = null;
        this.sceneIndex = 0;
        this.diagnostics = [
          diagnostic("parse_error", "/", `Could not parse ${sourceName}: ${error.message}`)
        ];
        this.render();
      }
    }

    loadDocument(documentObject) {
      this.document = documentObject;
      this.sceneIndex = 0;
      this.selected = null;
      this.diagnostics = validateDocument(documentObject);
      this.render();
    }

    goToScene(nextIndex) {
      if (!this.document?.scenes?.length) {
        return;
      }
      this.sceneIndex = clamp(nextIndex, 0, this.document.scenes.length - 1);
      this.selected = null;
      this.render();
    }

    render() {
      this.renderDocumentHeader();
      this.renderSceneList();
      this.renderScene();
      this.renderDiagnostics();
    }

    renderDocumentHeader() {
      const metadata = this.document?.metadata ?? {};
      this.dom["document-title"].textContent = metadata.title || "No document loaded";
      this.dom["document-description"].textContent = metadata.description || metadata.domain || "Load an Explainer document to begin.";
      replaceChildren(
        this.dom["document-tags"],
        ...(metadata.tags ?? []).map((tag) => el("span", { className: "tag", text: tag }))
      );
    }

    renderSceneList() {
      const scenes = this.document?.scenes ?? [];
      const items = scenes.map((scene, index) => {
        const button = el("button", {
          className: `scene-tab${index === this.sceneIndex ? " active" : ""}`,
          type: "button"
        });
        button.textContent = `${index + 1}. ${scene.title || scene.id}`;
        button.addEventListener("click", () => this.goToScene(index));
        return button;
      });
      replaceChildren(this.dom["scene-list"], ...items);
      this.dom["scene-counter"].textContent = `${scenes.length ? this.sceneIndex + 1 : 0} / ${scenes.length}`;
      this.dom["previous-scene"].disabled = this.sceneIndex <= 0;
      this.dom["next-scene"].disabled = this.sceneIndex >= scenes.length - 1;
    }

    renderScene() {
      const scene = this.currentScene();
      if (!scene) {
        this.dom["scene-kicker"].textContent = "Scene";
        this.dom["scene-title"].textContent = "Load a document";
        replaceChildren(this.dom["visual-stage"], el("div", { className: "empty-state", text: "No renderable scene is available." }));
        replaceChildren(this.dom["narration-panel"]);
        replaceChildren(this.dom["artifact-panel"]);
        replaceChildren(this.dom["focus-panel"]);
        this.dom["selection-panel"].textContent = "Select a visual element or relationship.";
        return;
      }

      this.dom["scene-kicker"].textContent = `Scene ${this.sceneIndex + 1} · ${scene.id}`;
      this.dom["scene-title"].textContent = scene.title || scene.id;
      this.renderVisual(scene);
      this.renderNarration(scene);
      this.renderArtifacts(scene);
      this.renderFocus(scene);
      this.renderSelection();
    }

    renderVisual(scene) {
      this.elementsById.clear();
      this.relationshipsById.clear();
      this.positionsById.clear();

      if (!scene.visual) {
        replaceChildren(this.dom["visual-stage"], el("div", { className: "empty-state", text: "This scene has narration or artifacts without a primary visual." }));
        return;
      }

      const visual = scene.visual;
      const layout = layoutElements(visual);
      layout.positions.forEach((value, key) => this.positionsById.set(key, value));
      const viewBox = calculateViewBox(visual, layout);
      const svg = svgEl("svg", {
        class: "visual-svg",
        viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
        role: "img",
        "aria-label": scene.title || scene.id
      });
      appendDefs(svg);

      const focusClasses = buildFocusClassMap(scene.focus ?? []);
      const focusIds = new Set(Array.from(focusClasses.keys()));
      const hasFocus = focusIds.size > 0;
      const relationshipsLayer = svgEl("g", { class: "relationships-layer" });
      const elementsLayer = svgEl("g", { class: "elements-layer" });

      for (const relationship of visual.relationships ?? []) {
        const node = this.renderRelationship(relationship, focusClasses, hasFocus);
        relationshipsLayer.appendChild(node);
        this.relationshipsById.set(relationship.id, relationship);
      }

      for (const elementObject of visual.elements) {
        const node = this.renderElement(elementObject, focusClasses, hasFocus);
        elementsLayer.appendChild(node);
        this.elementsById.set(elementObject.id, elementObject);
      }

      svg.append(relationshipsLayer, elementsLayer);
      replaceChildren(this.dom["visual-stage"], svg);
      this.applyAnimations(scene.animations ?? []);
    }

    renderElement(elementObject, focusClasses, hasFocus) {
      const box = this.positionsById.get(elementObject.id);
      const groupClasses = [
        "visual-element",
        `element-kind-${elementObject.kind}`,
        toneClass(elementObject.appearance?.tone),
        emphasisClass(elementObject.appearance?.emphasis),
        focusClasses.get(elementObject.id),
        this.selected?.kind === "element" && this.selected.id === elementObject.id ? "selected" : "",
        hasFocus && !focusClasses.has(elementObject.id) ? "focus-dim" : ""
      ].filter(Boolean).join(" ");
      const group = svgEl("g", {
        class: groupClasses,
        "data-kind": "element",
        "data-id": elementObject.id,
        tabindex: "0",
        role: "button",
        "aria-label": elementObject.label || elementObject.id
      });
      group.style.opacity = normalizedOpacity(elementObject.appearance?.opacity);
      group.addEventListener("click", () => this.selectEntity("element", elementObject.id));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          this.selectEntity("element", elementObject.id);
        }
      });

      for (const shape of elementShapes(elementObject, box)) {
        group.appendChild(shape);
      }
      if (elementObject.kind !== "image") {
        addElementText(group, elementObject, box);
      }
      addBadges(group, elementObject.appearance?.badges ?? [], box);
      return group;
    }

    renderRelationship(relationship, focusClasses, hasFocus) {
      const from = this.positionsById.get(relationship.from);
      const to = this.positionsById.get(relationship.to);
      const groupClasses = [
        "visual-relationship",
        lineToneClass(relationship.line?.tone),
        focusClasses.get(relationship.id),
        this.selected?.kind === "relationship" && this.selected.id === relationship.id ? "selected" : "",
        hasFocus && !focusClasses.has(relationship.id) ? "focus-dim" : ""
      ].filter(Boolean).join(" ");
      const group = svgEl("g", {
        class: groupClasses,
        "data-kind": "relationship",
        "data-id": relationship.id,
        tabindex: "0",
        role: "button",
        "aria-label": relationship.label || relationship.id
      });
      group.style.opacity = normalizedOpacity(relationship.line?.opacity);
      group.addEventListener("click", () => this.selectEntity("relationship", relationship.id));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          this.selectEntity("relationship", relationship.id);
        }
      });

      if (!from || !to) {
        group.appendChild(svgEl("text", { x: 20, y: 20, class: "relationship-label" }, `Missing endpoint: ${relationship.id}`));
        return group;
      }

      const start = edgePoint(from, centerOf(to));
      const end = edgePoint(to, centerOf(from));
      const path = svgEl("path", {
        class: "relationship-line",
        d: relationshipPath(relationship.path, start, end),
        "stroke-width": lineWeight(relationship.line?.weight),
        "stroke-dasharray": lineDash(relationship.line?.pattern),
        "marker-start": markerUrl(relationship.startDecoration),
        "marker-end": markerUrl(relationship.endDecoration)
      });
      group.appendChild(path);

      if (relationship.label) {
        const mid = relationshipMidpoint(relationship.path, start, end);
        const width = Math.max(44, relationship.label.length * 7 + 18);
        group.appendChild(svgEl("rect", {
          class: "relationship-label-bg",
          x: mid.x - width / 2,
          y: mid.y - 12,
          width,
          height: 24,
          rx: 4
        }));
        group.appendChild(svgEl("text", { class: "relationship-label", x: mid.x, y: mid.y }, relationship.label));
      }

      return group;
    }

    applyAnimations(animations) {
      for (const animation of animations) {
        if (!PROTOCOL.animationKinds.has(animation.kind)) {
          continue;
        }
        const selector = `[data-kind="${animation.target?.kind}"][data-id="${cssEscape(animation.target?.id)}"]`;
        const target = this.dom["visual-stage"].querySelector(selector);
        if (!target) {
          continue;
        }
        const className = `anim-${animation.kind}`;
        target.classList.add(className);
        target.style.setProperty("--duration", `${animation.durationMs ?? 700}ms`);
        target.style.setProperty("--delay", `${animation.delayMs ?? 0}ms`);
        target.style.setProperty("--repeat", animation.repeat === "infinite" ? "infinite" : String(animation.repeat ?? 1));
      }
    }

    renderNarration(scene) {
      const blocks = (scene.narration ?? []).map((block) => {
        const wrapper = el("div", { className: "narration-block" });
        if (block.kind === "text") {
          wrapper.textContent = block.text;
        } else if (block.kind === "markdown") {
          wrapper.appendChild(renderMarkdown(block.markdown));
        } else if (block.kind === "steps") {
          const list = el("ol");
          for (const step of block.steps) {
            list.appendChild(el("li", { text: step }));
          }
          wrapper.appendChild(list);
        } else {
          wrapper.textContent = `Unsupported narration block: ${block.kind}`;
        }
        return wrapper;
      });
      replaceChildren(this.dom["narration-panel"], ...blocks.length ? blocks : [emptySmall("No narration for this scene.")]);
    }

    renderArtifacts(scene) {
      const artifacts = (scene.artifacts ?? []).map((artifact) => {
        const item = el("article", { className: "artifact-item" });
        item.appendChild(el("strong", { text: artifact.title || artifact.id }));
        item.appendChild(el("p", { text: `${artifact.kind} · ${artifact.id}` }));
        if (artifact.description) {
          item.appendChild(el("p", { text: artifact.description }));
        }
        item.appendChild(renderLocator(artifact.locator));
        appendMetadata(item, artifact.metadata);
        return item;
      });
      replaceChildren(this.dom["artifact-panel"], ...artifacts.length ? artifacts : [emptySmall("No artifacts for this scene.")]);
    }

    renderFocus(scene) {
      const items = (scene.focus ?? []).map((focus) => {
        const item = el("article", { className: "focus-item" });
        item.appendChild(el("strong", { text: `${focus.role || "focus"} · ${focus.target.kind}:${focus.target.id}` }));
        if (focus.reason) {
          item.appendChild(el("p", { text: focus.reason }));
        }
        return item;
      });
      replaceChildren(this.dom["focus-panel"], ...items.length ? items : [emptySmall("No focus targets for this scene.")]);
    }

    renderSelection() {
      const scene = this.currentScene();
      if (!scene || !this.selected) {
        this.dom["selection-panel"].textContent = "Select a visual element or relationship.";
        return;
      }

      const entity = this.selected.kind === "element"
        ? this.elementsById.get(this.selected.id)
        : this.relationshipsById.get(this.selected.id);
      if (!entity) {
        this.dom["selection-panel"].textContent = "Selection is not present in this scene.";
        return;
      }

      const panel = el("div");
      panel.appendChild(el("strong", { text: entity.label || entity.title || entity.id }));
      panel.appendChild(el("p", { text: `${this.selected.kind} · ${entity.kind || entity.id}` }));
      if (entity.description) {
        panel.appendChild(el("p", { text: entity.description }));
      }
      const refs = resolveArtifactRefs(entity.artifactRefs ?? [], scene.artifacts ?? []);
      if (refs.length) {
        panel.appendChild(el("p", { text: `Artifacts: ${refs.map((artifact) => artifact.title || artifact.id).join(", ")}` }));
      }
      appendMetadata(panel, entity.metadata);
      replaceChildren(this.dom["selection-panel"], panel);
    }

    renderDiagnostics() {
      const items = this.diagnostics.map((item) => {
        const wrapper = el("article", { className: "diagnostic-item" });
        wrapper.appendChild(el("strong", { text: item.code }));
        wrapper.appendChild(el("p", { text: item.path }));
        wrapper.appendChild(el("p", { text: item.message }));
        return wrapper;
      });
      replaceChildren(this.dom["diagnostic-panel"], ...items.length ? items : [emptySmall("No diagnostics.")]);
    }

    selectEntity(kind, id) {
      this.selected = { kind, id };
      this.renderScene();
    }

    currentScene() {
      return this.document?.scenes?.[this.sceneIndex] ?? null;
    }
  }

  function validateDocument(documentObject) {
    const diagnostics = [];
    if (!isObject(documentObject)) {
      return [diagnostic("invalid_document", "/", "Document must be an object.")];
    }
    if (!documentObject.schemaVersion) {
      diagnostics.push(diagnostic("missing_schema_version", "/schemaVersion", "Document is missing schemaVersion."));
    }
    if (!isObject(documentObject.metadata) || !documentObject.metadata.title) {
      diagnostics.push(diagnostic("missing_metadata_title", "/metadata/title", "Document metadata must include a title."));
    }
    if (!Array.isArray(documentObject.scenes) || documentObject.scenes.length === 0) {
      diagnostics.push(diagnostic("missing_scenes", "/scenes", "Document must include at least one scene."));
      return diagnostics;
    }

    const sceneIds = new Set();
    documentObject.scenes.forEach((scene, sceneIndex) => {
      const scenePath = `/scenes/${sceneIndex}`;
      if (!scene.id) {
        diagnostics.push(diagnostic("missing_scene_id", `${scenePath}/id`, "Scene must include an id."));
      }
      if (sceneIds.has(scene.id)) {
        diagnostics.push(diagnostic("duplicate_scene_id", `${scenePath}/id`, `Scene id "${scene.id}" is used more than once.`));
      }
      sceneIds.add(scene.id);
      if (!scene.narration && !scene.visual) {
        diagnostics.push(diagnostic("empty_scene", scenePath, "Scene must include narration or visual content."));
      }
      validateNarration(scene.narration ?? [], scenePath, diagnostics);
      validateArtifacts(scene.artifacts ?? [], scenePath, diagnostics);
      validateVisual(scene, scenePath, diagnostics);
    });
    return diagnostics;
  }

  function validateNarration(narration, scenePath, diagnostics) {
    narration.forEach((block, index) => {
      if (!PROTOCOL.narrationKinds.has(block.kind)) {
        diagnostics.push(diagnostic("unsupported_narration_kind", `${scenePath}/narration/${index}/kind`, `Unsupported narration kind "${block.kind}".`));
      }
    });
  }

  function validateArtifacts(artifacts, scenePath, diagnostics) {
    const artifactIds = new Set();
    artifacts.forEach((artifact, index) => {
      const artifactPath = `${scenePath}/artifacts/${index}`;
      if (artifactIds.has(artifact.id)) {
        diagnostics.push(diagnostic("duplicate_artifact_id", `${artifactPath}/id`, `Artifact id "${artifact.id}" is duplicated in the scene.`));
      }
      artifactIds.add(artifact.id);
      if (!PROTOCOL.artifactKinds.has(artifact.kind)) {
        diagnostics.push(diagnostic("unsupported_artifact_kind", `${artifactPath}/kind`, `Unsupported artifact kind "${artifact.kind}".`));
      }
      if (!artifact.locator || !PROTOCOL.locatorKinds.has(artifact.locator.kind)) {
        diagnostics.push(diagnostic("unsupported_locator_kind", `${artifactPath}/locator/kind`, `Unsupported locator kind "${artifact.locator?.kind}".`));
      }
      const range = artifact.locator?.range;
      if (range && range.startLine > range.endLine) {
        diagnostics.push(diagnostic("invalid_text_range", `${artifactPath}/locator/range`, "Range startLine must be less than or equal to endLine."));
      }
    });
  }

  function validateVisual(scene, scenePath, diagnostics) {
    const visual = scene.visual;
    if (!visual) {
      if (scene.focus?.length) {
        diagnostics.push(diagnostic("focus_without_visual", `${scenePath}/focus`, "Focus targets need a scene visual."));
      }
      if (scene.animations?.length) {
        diagnostics.push(diagnostic("animation_without_visual", `${scenePath}/animations`, "Animations need a scene visual."));
      }
      return;
    }
    if (!PROTOCOL.visualKinds.has(visual.kind)) {
      diagnostics.push(diagnostic("unsupported_visual_kind", `${scenePath}/visual/kind`, `Unsupported visual kind "${visual.kind}".`));
    }

    const elementIds = new Set();
    const relationshipIds = new Set();
    const artifactIds = new Set((scene.artifacts ?? []).map((artifact) => artifact.id));

    (visual.elements ?? []).forEach((elementObject, index) => {
      const elementPath = `${scenePath}/visual/elements/${index}`;
      if (elementIds.has(elementObject.id)) {
        diagnostics.push(diagnostic("duplicate_element_id", `${elementPath}/id`, `Element id "${elementObject.id}" is duplicated in the scene.`));
      }
      elementIds.add(elementObject.id);
      if (!PROTOCOL.elementKinds.has(elementObject.kind)) {
        diagnostics.push(diagnostic("unsupported_element_kind", `${elementPath}/kind`, `Unsupported element kind "${elementObject.kind}".`));
      }
      validateArtifactRefs(elementObject.artifactRefs ?? [], artifactIds, `${elementPath}/artifactRefs`, diagnostics);
    });

    (visual.relationships ?? []).forEach((relationship, index) => {
      const relationshipPathValue = `${scenePath}/visual/relationships/${index}`;
      if (relationshipIds.has(relationship.id)) {
        diagnostics.push(diagnostic("duplicate_relationship_id", `${relationshipPathValue}/id`, `Relationship id "${relationship.id}" is duplicated in the scene.`));
      }
      relationshipIds.add(relationship.id);
      if (!elementIds.has(relationship.from)) {
        diagnostics.push(diagnostic("missing_relationship_endpoint", `${relationshipPathValue}/from`, `Relationship endpoint "${relationship.from}" is missing.`));
      }
      if (!elementIds.has(relationship.to)) {
        diagnostics.push(diagnostic("missing_relationship_endpoint", `${relationshipPathValue}/to`, `Relationship endpoint "${relationship.to}" is missing.`));
      }
      validateArtifactRefs(relationship.artifactRefs ?? [], artifactIds, `${relationshipPathValue}/artifactRefs`, diagnostics);
    });

    (scene.focus ?? []).forEach((focus, index) => {
      validateTargetRef(focus.target, elementIds, relationshipIds, `${scenePath}/focus/${index}/target`, "missing_focus_target", diagnostics);
    });
    (scene.animations ?? []).forEach((animation, index) => {
      if (!PROTOCOL.animationKinds.has(animation.kind)) {
        diagnostics.push(diagnostic("unsupported_animation_kind", `${scenePath}/animations/${index}/kind`, `Unsupported animation kind "${animation.kind}".`));
      }
      if (animation.kind === "sequence") {
        diagnostics.push(diagnostic("flat_animation_sequence", `${scenePath}/animations/${index}`, "V1 sequence animations have no nested member structure; the target is highlighted statically."));
      }
      validateTargetRef(animation.target, elementIds, relationshipIds, `${scenePath}/animations/${index}/target`, "missing_animation_target", diagnostics);
    });
    (visual.viewport?.targetIds ?? []).forEach((targetId, index) => {
      if (!elementIds.has(targetId) && !relationshipIds.has(targetId)) {
        diagnostics.push(diagnostic("missing_viewport_target", `${scenePath}/visual/viewport/targetIds/${index}`, `Viewport target "${targetId}" is missing.`));
      }
    });
  }

  function validateArtifactRefs(refs, artifactIds, path, diagnostics) {
    refs.forEach((ref, index) => {
      if (!artifactIds.has(ref)) {
        diagnostics.push(diagnostic("missing_artifact_ref", `${path}/${index}`, `Artifact reference "${ref}" does not match a same-scene artifact.`));
      }
    });
  }

  function validateTargetRef(target, elementIds, relationshipIds, path, code, diagnostics) {
    if (!target) {
      diagnostics.push(diagnostic(code, path, "Target is missing."));
      return;
    }
    const valid = target.kind === "element" ? elementIds.has(target.id) : relationshipIds.has(target.id);
    if (!valid) {
      diagnostics.push(diagnostic(code, `${path}/id`, `Target "${target.kind}:${target.id}" does not match a same-scene visual entity.`));
    }
  }

  function layoutElements(visual) {
    const elements = visual.elements ?? [];
    const layout = visual.layout ?? {};
    const bounds = layout.bounds ?? { x: 40, y: 40, width: 920, height: 560 };
    const positions = new Map();
    const manual = layout.strategy === "manual" || elements.some((item) => item.geometry?.x !== undefined || item.geometry?.y !== undefined);

    if (manual) {
      for (const elementObject of elements) {
        positions.set(elementObject.id, normalizeBox(elementObject.geometry, bounds));
      }
      return { positions, bounds };
    }

    const direction = layout.direction ?? defaultDirection(visual.kind);
    if (visual.kind === "timeline") {
      layoutTimeline(elements, positions, bounds);
    } else if (visual.kind === "tree") {
      layoutTree(elements, visual.relationships ?? [], positions, bounds, direction);
    } else if (visual.kind === "graph") {
      layoutRadial(elements, positions, bounds);
    } else if (visual.kind === "table") {
      layoutGrid(elements, positions, bounds, Math.ceil(Math.sqrt(elements.length || 1)));
    } else {
      layoutLinear(elements, positions, bounds, direction);
    }
    return { positions, bounds };
  }

  function normalizeBox(geometry = {}, bounds) {
    const width = geometry.width ?? 150;
    const height = geometry.height ?? 84;
    return {
      x: geometry.x ?? bounds.x,
      y: geometry.y ?? bounds.y,
      width,
      height
    };
  }

  function layoutLinear(elements, positions, bounds, direction) {
    const horizontal = direction === "leftToRight" || direction === "rightToLeft";
    const count = Math.max(elements.length, 1);
    elements.forEach((elementObject, index) => {
      const order = direction === "rightToLeft" || direction === "bottomToTop" ? count - index - 1 : index;
      const width = elementObject.geometry?.width ?? 150;
      const height = elementObject.geometry?.height ?? 84;
      const x = horizontal
        ? bounds.x + ((bounds.width - width) * (order + 0.5)) / count - width / 2
        : bounds.x + bounds.width / 2 - width / 2;
      const y = horizontal
        ? bounds.y + bounds.height / 2 - height / 2
        : bounds.y + ((bounds.height - height) * (order + 0.5)) / count - height / 2;
      positions.set(elementObject.id, { x, y, width, height });
    });
  }

  function layoutTimeline(elements, positions, bounds) {
    const count = Math.max(elements.length, 1);
    elements.forEach((elementObject, index) => {
      const width = elementObject.geometry?.width ?? 138;
      const height = elementObject.geometry?.height ?? 74;
      positions.set(elementObject.id, {
        x: bounds.x + ((bounds.width - width) * (index + 0.5)) / count - width / 2,
        y: bounds.y + bounds.height / 2 - height / 2 + (index % 2 === 0 ? -70 : 70),
        width,
        height
      });
    });
  }

  function layoutGrid(elements, positions, bounds, columns) {
    const rows = Math.max(1, Math.ceil(elements.length / columns));
    const cellWidth = bounds.width / columns;
    const cellHeight = bounds.height / rows;
    elements.forEach((elementObject, index) => {
      const width = elementObject.geometry?.width ?? Math.min(150, cellWidth * 0.72);
      const height = elementObject.geometry?.height ?? Math.min(84, cellHeight * 0.62);
      const column = index % columns;
      const row = Math.floor(index / columns);
      positions.set(elementObject.id, {
        x: bounds.x + column * cellWidth + cellWidth / 2 - width / 2,
        y: bounds.y + row * cellHeight + cellHeight / 2 - height / 2,
        width,
        height
      });
    });
  }

  function layoutRadial(elements, positions, bounds) {
    const radius = Math.min(bounds.width, bounds.height) * 0.34;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    elements.forEach((elementObject, index) => {
      const width = elementObject.geometry?.width ?? 138;
      const height = elementObject.geometry?.height ?? 78;
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(elements.length, 1);
      positions.set(elementObject.id, {
        x: center.x + Math.cos(angle) * radius - width / 2,
        y: center.y + Math.sin(angle) * radius - height / 2,
        width,
        height
      });
    });
  }

  function layoutTree(elements, relationships, positions, bounds, direction) {
    const ids = new Set(elements.map((item) => item.id));
    const childrenByParent = new Map();
    const childIds = new Set();
    for (const relationship of relationships) {
      if (!ids.has(relationship.from) || !ids.has(relationship.to)) {
        continue;
      }
      childIds.add(relationship.to);
      const children = childrenByParent.get(relationship.from) ?? [];
      children.push(relationship.to);
      childrenByParent.set(relationship.from, children);
    }
    const roots = elements.filter((item) => !childIds.has(item.id));
    const ordered = roots.length ? roots : elements;
    const levels = new Map();
    const visit = (id, depth) => {
      if (levels.has(id) && levels.get(id) <= depth) {
        return;
      }
      levels.set(id, depth);
      for (const child of childrenByParent.get(id) ?? []) {
        visit(child, depth + 1);
      }
    };
    ordered.forEach((item) => visit(item.id, 0));
    elements.forEach((item) => {
      if (!levels.has(item.id)) {
        levels.set(item.id, 0);
      }
    });
    const buckets = new Map();
    for (const item of elements) {
      const bucket = buckets.get(levels.get(item.id)) ?? [];
      bucket.push(item);
      buckets.set(levels.get(item.id), bucket);
    }
    const horizontal = direction === "leftToRight" || direction === "rightToLeft";
    const maxDepth = Math.max(...levels.values(), 0);
    for (const [depth, bucket] of buckets.entries()) {
      bucket.forEach((item, index) => {
        const width = item.geometry?.width ?? 144;
        const height = item.geometry?.height ?? 78;
        const primary = maxDepth === 0 ? 0.5 : depth / maxDepth;
        const secondary = (index + 0.5) / bucket.length;
        positions.set(item.id, {
          x: horizontal ? bounds.x + primary * (bounds.width - width) : bounds.x + secondary * bounds.width - width / 2,
          y: horizontal ? bounds.y + secondary * bounds.height - height / 2 : bounds.y + primary * (bounds.height - height),
          width,
          height
        });
      });
    }
  }

  function calculateViewBox(visual, layout) {
    const viewport = visual.viewport ?? {};
    const padding = viewport.padding ?? 64;
    const allBoxes = Array.from(layout.positions.values());
    let boxes = allBoxes;
    if (viewport.mode === "fitSelection" && viewport.targetIds?.length) {
      boxes = boxesForIds(viewport.targetIds, layout.positions, visual.relationships ?? []);
    }
    if (viewport.mode === "manual" && viewport.center && viewport.zoom) {
      const width = Math.max(220, layout.bounds.width / viewport.zoom);
      const height = Math.max(160, layout.bounds.height / viewport.zoom);
      return { x: viewport.center.x - width / 2, y: viewport.center.y - height / 2, width, height };
    }
    if (!boxes.length) {
      boxes = allBoxes.length ? allBoxes : [layout.bounds];
    }
    return paddedBounds(boxes, padding);
  }

  function boxesForIds(ids, positions, relationships) {
    const boxes = [];
    for (const id of ids) {
      if (positions.has(id)) {
        boxes.push(positions.get(id));
      }
      const relationship = relationships.find((item) => item.id === id);
      if (relationship) {
        if (positions.has(relationship.from)) {
          boxes.push(positions.get(relationship.from));
        }
        if (positions.has(relationship.to)) {
          boxes.push(positions.get(relationship.to));
        }
      }
    }
    return boxes;
  }

  function paddedBounds(boxes, padding) {
    const minX = Math.min(...boxes.map((box) => box.x));
    const minY = Math.min(...boxes.map((box) => box.y));
    const maxX = Math.max(...boxes.map((box) => box.x + box.width));
    const maxY = Math.max(...boxes.map((box) => box.y + box.height));
    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(220, maxX - minX + padding * 2),
      height: Math.max(160, maxY - minY + padding * 2)
    };
  }

  function elementShapes(elementObject, box) {
    const shapeClass = "element-fill";
    const common = { class: shapeClass };
    const x = box.x;
    const y = box.y;
    const w = box.width;
    const h = box.height;
    switch (elementObject.kind) {
      case "roundedRectangle":
        return [svgEl("rect", { ...common, x, y, width: w, height: h, rx: 12 })];
      case "ellipse":
        return [svgEl("ellipse", { ...common, cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2 })];
      case "circle": {
        const radius = Math.min(w, h) / 2;
        return [svgEl("circle", { ...common, cx: x + w / 2, cy: y + h / 2, r: radius })];
      }
      case "diamond":
        return [svgEl("polygon", { ...common, points: `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}` })];
      case "triangle":
        return [svgEl("polygon", { ...common, points: `${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}` })];
      case "hexagon":
        return [svgEl("polygon", { ...common, points: `${x + w * 0.22},${y} ${x + w * 0.78},${y} ${x + w},${y + h / 2} ${x + w * 0.78},${y + h} ${x + w * 0.22},${y + h} ${x},${y + h / 2}` })];
      case "cylinder":
        return [
          svgEl("path", {
            ...common,
            d: `M ${x} ${y + 14} C ${x} ${y - 2}, ${x + w} ${y - 2}, ${x + w} ${y + 14} L ${x + w} ${y + h - 14} C ${x + w} ${y + h + 2}, ${x} ${y + h + 2}, ${x} ${y + h - 14} Z`
          }),
          svgEl("ellipse", { class: "element-fill", cx: x + w / 2, cy: y + 14, rx: w / 2, ry: 14, fill: "none" })
        ];
      case "cloud":
        return [svgEl("path", { ...common, d: `M ${x + w * 0.22} ${y + h * 0.72} C ${x - 8} ${y + h * 0.68}, ${x + 6} ${y + h * 0.28}, ${x + w * 0.28} ${y + h * 0.36} C ${x + w * 0.34} ${y - 4}, ${x + w * 0.72} ${y - 2}, ${x + w * 0.76} ${y + h * 0.32} C ${x + w + 14} ${y + h * 0.34}, ${x + w + 4} ${y + h * 0.78}, ${x + w * 0.72} ${y + h * 0.74} Z` })];
      case "document":
        return [svgEl("path", { ...common, d: `M ${x} ${y} H ${x + w * 0.78} L ${x + w} ${y + h * 0.22} V ${y + h} H ${x} Z M ${x + w * 0.78} ${y} V ${y + h * 0.22} H ${x + w}` })];
      case "note":
        return [svgEl("path", { ...common, d: `M ${x} ${y} H ${x + w} V ${y + h * 0.78} L ${x + w * 0.78} ${y + h} H ${x} Z M ${x + w * 0.78} ${y + h} V ${y + h * 0.78} H ${x + w}` })];
      case "container":
        return [svgEl("rect", { ...common, x, y, width: w, height: h, rx: 4, "stroke-dasharray": "8 6", fill: "rgba(255,250,240,0.35)" })];
      case "text":
        return [svgEl("rect", { ...common, x, y, width: w, height: h, rx: 2, fill: "transparent", "stroke-dasharray": "2 6" })];
      case "image":
        return renderImageShape(elementObject, box);
      case "icon":
        return [svgEl("circle", { ...common, cx: x + w / 2, cy: y + h / 2, r: Math.min(w, h) / 2 })];
      case "table":
        return renderTableShape(elementObject, box);
      case "custom":
      case "rectangle":
      default:
        return [svgEl("rect", { ...common, x, y, width: w, height: h, rx: 2 })];
    }
  }

  function renderImageShape(elementObject, box) {
    const source = elementObject.metadata?.src || elementObject.metadata?.url || elementObject.metadata?.href;
    const nodes = [svgEl("rect", { class: "element-fill", x: box.x, y: box.y, width: box.width, height: box.height, rx: 4 })];
    if (source) {
      nodes.push(svgEl("image", { href: source, x: box.x + 4, y: box.y + 4, width: box.width - 8, height: box.height - 8, preserveAspectRatio: "xMidYMid meet" }));
    } else {
      nodes.push(svgEl("path", { d: `M ${box.x + 16} ${box.y + box.height - 18} L ${box.x + box.width * 0.42} ${box.y + box.height * 0.52} L ${box.x + box.width * 0.58} ${box.y + box.height * 0.66} L ${box.x + box.width - 14} ${box.y + 20}`, fill: "none", stroke: "#6d675d", "stroke-width": 2 }));
    }
    return nodes;
  }

  function renderTableShape(elementObject, box) {
    const rows = Number(elementObject.metadata?.rows ?? 3);
    const columns = Number(elementObject.metadata?.columns ?? 3);
    const nodes = [svgEl("rect", { class: "element-fill", x: box.x, y: box.y, width: box.width, height: box.height, rx: 2 })];
    for (let row = 1; row < rows; row += 1) {
      const y = box.y + (box.height * row) / rows;
      nodes.push(svgEl("line", { x1: box.x, y1: y, x2: box.x + box.width, y2: y, stroke: "#d7cdbc" }));
    }
    for (let column = 1; column < columns; column += 1) {
      const x = box.x + (box.width * column) / columns;
      nodes.push(svgEl("line", { x1: x, y1: box.y, x2: x, y2: box.y + box.height, stroke: "#d7cdbc" }));
    }
    return nodes;
  }

  function addElementText(group, elementObject, box) {
    const label = elementObject.kind === "icon"
      ? elementObject.metadata?.icon || elementObject.label || elementObject.id
      : elementObject.label || elementObject.id;
    const lines = wrapLabel(String(label), Math.max(8, Math.floor(box.width / 8)));
    const lineHeight = 15;
    const startY = box.y + box.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      group.appendChild(svgEl("text", { class: "element-label", x: box.x + box.width / 2, y: startY + index * lineHeight }, line));
    });
    if (elementObject.description && box.height > 82) {
      group.appendChild(svgEl("text", { class: "element-description", x: box.x + box.width / 2, y: box.y + box.height - 14 }, truncate(elementObject.description, 34)));
    }
  }

  function addBadges(group, badges, box) {
    badges.slice(0, 3).forEach((badge, index) => {
      const label = truncate(String(badge), 8);
      const width = Math.max(28, label.length * 6 + 8);
      const x = box.x + box.width - width - 6;
      const y = box.y + 6 + index * 18;
      group.appendChild(svgEl("rect", { class: "badge", x, y, width, height: 14, rx: 7 }));
      group.appendChild(svgEl("text", { class: "badge-text", x: x + width / 2, y: y + 7 }, label));
    });
  }

  function appendDefs(svg) {
    const defs = svgEl("defs");
    for (const decoration of ["arrow", "circle", "diamond", "bar"]) {
      defs.appendChild(markerDef(decoration));
    }
    svg.appendChild(defs);
  }

  function markerDef(decoration) {
    const marker = svgEl("marker", {
      id: `marker-${decoration}`,
      viewBox: "-6 -6 12 12",
      refX: 5,
      refY: 0,
      markerWidth: 8,
      markerHeight: 8,
      orient: "auto-start-reverse"
    });
    if (decoration === "arrow") {
      marker.appendChild(svgEl("path", { d: "M -4 -4 L 5 0 L -4 4 Z", fill: "context-stroke" }));
    } else if (decoration === "circle") {
      marker.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 4, fill: "#fffdf8", stroke: "context-stroke", "stroke-width": 1.5 }));
    } else if (decoration === "diamond") {
      marker.appendChild(svgEl("polygon", { points: "0,-5 5,0 0,5 -5,0", fill: "#fffdf8", stroke: "context-stroke", "stroke-width": 1.5 }));
    } else if (decoration === "bar") {
      marker.appendChild(svgEl("path", { d: "M 0 -5 L 0 5", stroke: "context-stroke", "stroke-width": 2 }));
    }
    return marker;
  }

  function markerUrl(decoration) {
    return decoration && decoration !== "none" ? `url(#marker-${decoration})` : null;
  }

  function relationshipPath(kind, start, end) {
    if (kind === "orthogonal") {
      const midX = (start.x + end.x) / 2;
      return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    }
    if (kind === "curved") {
      const dx = end.x - start.x;
      return `M ${start.x} ${start.y} C ${start.x + dx * 0.38} ${start.y - 48}, ${end.x - dx * 0.38} ${end.y + 48}, ${end.x} ${end.y}`;
    }
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  function relationshipMidpoint(kind, start, end) {
    if (kind === "orthogonal") {
      return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    }
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - (kind === "curved" ? 24 : 0) };
  }

  function centerOf(box) {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  function edgePoint(box, toward) {
    const center = centerOf(box);
    const dx = toward.x - center.x;
    const dy = toward.y - center.y;
    const scale = Math.max(Math.abs(dx) / (box.width / 2 || 1), Math.abs(dy) / (box.height / 2 || 1), 1);
    return { x: center.x + dx / scale, y: center.y + dy / scale };
  }

  function buildFocusClassMap(focusTargets) {
    const classes = new Map();
    for (const focus of focusTargets) {
      classes.set(focus.target.id, `focus-${focus.role || "primary"}`);
    }
    return classes;
  }

  function renderLocator(locator) {
    if (!locator) {
      return el("p", { className: "locator", text: "No locator." });
    }
    const parts = [];
    if (locator.kind === "workspacePath") {
      parts.push(locator.path);
    } else if (locator.kind === "fileUrl" || locator.kind === "url") {
      const href = locator.kind === "url" && locator.fragment ? `${locator.url}#${locator.fragment}` : locator.url;
      const link = el("a", { href, text: href });
      link.target = "_blank";
      link.rel = "noreferrer";
      const wrapper = el("p", { className: "locator" });
      wrapper.append(`${locator.kind}: `, link);
      appendRange(wrapper, locator);
      return wrapper;
    }
    const wrapper = el("p", { className: "locator", text: `${locator.kind}: ${parts.join(" ")}` });
    appendRange(wrapper, locator);
    return wrapper;
  }

  function appendRange(wrapper, locator) {
    if (locator.range) {
      wrapper.append(` · lines ${locator.range.startLine}-${locator.range.endLine}`);
      if (locator.range.startColumn || locator.range.endColumn) {
        wrapper.append(` cols ${locator.range.startColumn ?? "?"}-${locator.range.endColumn ?? "?"}`);
      }
    }
    if (locator.symbol) {
      wrapper.append(` · ${locator.symbol}`);
    }
  }

  function appendMetadata(parent, metadata) {
    if (!metadata || !Object.keys(metadata).length) {
      return;
    }
    const details = el("details", { className: "metadata-details" });
    details.appendChild(el("summary", { text: "Metadata" }));
    details.appendChild(el("pre", { text: JSON.stringify(metadata, null, 2) }));
    parent.appendChild(details);
  }

  function renderMarkdown(markdown) {
    const container = el("div");
    const lines = String(markdown).split(/\r?\n/);
    let list = null;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        list = null;
        continue;
      }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const bullet = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (heading) {
        list = null;
        container.appendChild(el(`h${Math.min(3, heading[1].length + 3)}`, { html: inlineMarkdown(heading[2]) }));
      } else if (bullet || ordered) {
        const tag = ordered ? "ol" : "ul";
        if (!list || list.tagName.toLowerCase() !== tag) {
          list = el(tag);
          container.appendChild(list);
        }
        list.appendChild(el("li", { html: inlineMarkdown((bullet || ordered)[1]) }));
      } else {
        list = null;
        container.appendChild(el("p", { html: inlineMarkdown(line) }));
      }
    }
    return container;
  }

  function inlineMarkdown(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  }

  function parseDocumentText(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("empty input");
    }
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
    return parsePlainYaml(trimmed);
  }

  function parsePlainYaml(text) {
    const lines = text
      .replace(/\t/g, "  ")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"));
    const root = {};
    const stack = [{ indent: -1, value: root }];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const nextLine = lines[lineIndex + 1] ?? "";
      const indent = line.match(/^ */)[0].length;
      const nextIndent = nextLine ? nextLine.match(/^ */)[0].length : indent + 2;
      const content = line.trim();
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1].value;
      if (content.startsWith("- ")) {
        if (!Array.isArray(parent)) {
          throw new Error(`list item has no list parent near "${content}"`);
        }
        const itemContent = content.slice(2);
        if (!itemContent) {
          const child = {};
          parent.push(child);
          stack.push({ indent, value: child });
        } else if (itemContent.includes(":")) {
          const child = {};
          parent.push(child);
          stack.push({ indent, value: child });
          lineIndex = assignYamlPair(child, itemContent, indent, nextIndent, stack, lines, lineIndex);
        } else {
          parent.push(parseYamlScalar(itemContent));
        }
        continue;
      }

      const [key, rawValue] = splitYamlPair(content);
      if (isBlockScalar(rawValue)) {
        const block = readBlockScalar(lines, lineIndex, indent, rawValue);
        parent[key] = block.value;
        lineIndex = block.endIndex;
      } else if (rawValue === "") {
        const child = nextLine.trim().startsWith("- ") ? [] : {};
        parent[key] = child;
        stack.push({ indent: nextIndent - 1, value: child });
      } else {
        parent[key] = parseYamlScalar(rawValue);
      }
    }
    return root;
  }

  function assignYamlPair(object, content, indent, nextIndent, stack, lines, lineIndex) {
    const [key, rawValue] = splitYamlPair(content);
    if (isBlockScalar(rawValue)) {
      const block = readBlockScalar(lines, lineIndex, indent, rawValue);
      object[key] = block.value;
      return block.endIndex;
    }
    if (rawValue === "") {
      const child = {};
      object[key] = child;
      stack.push({ indent: nextIndent - 1, value: child });
    } else {
      object[key] = parseYamlScalar(rawValue);
    }
    return lineIndex;
  }

  function splitYamlPair(content) {
    const index = content.indexOf(":");
    if (index < 0) {
      throw new Error(`expected key/value pair near "${content}"`);
    }
    return [content.slice(0, index).trim(), content.slice(index + 1).trim()];
  }

  function isBlockScalar(value) {
    return /^[>|][+-]?$/.test(value);
  }

  function readBlockScalar(lines, startIndex, parentIndent, indicator) {
    const blockLines = [];
    let endIndex = startIndex;
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      const indent = line.match(/^ */)[0].length;
      if (line.trim() && indent <= parentIndent) {
        break;
      }
      blockLines.push(line);
      endIndex = index;
    }

    const contentIndent = Math.min(
      ...blockLines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length)
    );
    const normalized = blockLines.map((line) => line.slice(Number.isFinite(contentIndent) ? contentIndent : 0));
    const style = indicator[0];
    const chomp = indicator.slice(1);
    const value = style === "|"
      ? normalized.join("\n")
      : foldYamlLines(normalized);

    return {
      value: chompBlockScalar(value, chomp),
      endIndex
    };
  }

  function foldYamlLines(lines) {
    const paragraphs = [];
    let current = [];
    for (const line of lines) {
      if (!line.trim()) {
        if (current.length) {
          paragraphs.push(current.join(" "));
          current = [];
        }
        paragraphs.push("");
      } else {
        current.push(line.trim());
      }
    }
    if (current.length) {
      paragraphs.push(current.join(" "));
    }
    return paragraphs.join("\n");
  }

  function chompBlockScalar(value, chomp) {
    if (chomp === "-") {
      return value.replace(/\n+$/g, "");
    }
    if (chomp === "+") {
      return `${value}\n`;
    }
    return `${value.replace(/\n+$/g, "")}\n`;
  }

  function parseYamlScalar(value) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (value === "null" || value === "~") {
      return null;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  function defaultDirection(kind) {
    if (kind === "tree") {
      return "topToBottom";
    }
    return "leftToRight";
  }

  function toneClass(tone) {
    return tone && tone !== "default" ? `tone-${tone}` : "";
  }

  function emphasisClass(emphasis) {
    return emphasis && emphasis !== "none" ? `emphasis-${emphasis}` : "";
  }

  function lineToneClass(tone) {
    return tone && tone !== "default" ? `line-tone-${tone}` : "";
  }

  function lineWeight(weight) {
    return { thin: 1, regular: 1.5, thick: 3 }[weight] ?? 1.5;
  }

  function lineDash(pattern) {
    return { dashed: "8 6", dotted: "2 5" }[pattern] ?? null;
  }

  function normalizedOpacity(value) {
    return value === undefined ? "1" : String(clamp(Number(value), 0, 1));
  }

  function resolveArtifactRefs(refs, artifacts) {
    const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
    return refs.map((ref) => byId.get(ref)).filter(Boolean);
  }

  function wrapLabel(value, maxLength) {
    const words = value.split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
      if (`${current} ${word}`.trim().length > maxLength && current) {
        lines.push(current);
        current = word;
      } else {
        current = `${current} ${word}`.trim();
      }
    }
    if (current) {
      lines.push(current);
    }
    return lines.slice(0, 3);
  }

  function truncate(value, maxLength) {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }

  function diagnostic(code, path, message) {
    return { code, path, message };
  }

  function emptySmall(text) {
    return el("div", { className: "diagnostic-item", text });
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cssEscape(value) {
    return String(value ?? "").replace(/["\\]/g, "\\$&");
  }

  function escapeHtml(value) {
    const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value).replace(/[&<>"']/g, (char) => replacements[char]);
  }

  function replaceChildren(node, ...children) {
    node.replaceChildren(...children);
  }

  function el(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) {
      node.className = options.className;
    }
    if (options.type) {
      node.type = options.type;
    }
    if (options.href) {
      node.href = options.href;
    }
    if (options.text !== undefined) {
      node.textContent = options.text;
    }
    if (options.html !== undefined) {
      node.innerHTML = options.html;
    }
    return node;
  }

  function svgEl(tag, attributes = {}, text = null) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== null && value !== undefined) {
        node.setAttribute(key, String(value));
      }
    }
    if (text !== null) {
      node.textContent = text;
    }
    return node;
  }

  window.ExplainerWebRenderer = {
    Renderer: ExplainerWebRenderer,
    parseDocumentText,
    validateDocument,
    layoutElements,
    SAMPLE_DOCUMENT
  };

  window.addEventListener("DOMContentLoaded", () => {
    new ExplainerWebRenderer(document);
  });
})();
