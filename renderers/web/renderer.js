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
              kind: "filePath",
              path: "/Users/example/project/Sources/API/ProfileController.swift",
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
    locatorKinds: new Set(["filePath", "fileUrl", "url"]),
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
      this.artifactTextCache = new Map();
      this.artifactRenderToken = 0;
      this.bindDom();
      this.bindEvents();
      this.loadDefaultDocument();
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
        "artifact-panel"
      ];
      this.dom = Object.fromEntries(ids.map((id) => [id, this.root.getElementById(id)]));
    }

    bindEvents() {
      this.dom["previous-scene"].addEventListener("click", () => this.goToScene(this.sceneIndex - 1));
      this.dom["next-scene"].addEventListener("click", () => this.goToScene(this.sceneIndex + 1));
      this.dom["load-sample"].addEventListener("click", () => this.loadDefaultDocument());
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

    loadDefaultDocument() {
      if (window.ExplainerDefaultDocumentYaml) {
        this.loadText(window.ExplainerDefaultDocumentYaml, "default document");
        return;
      }
      this.loadDocument(SAMPLE_DOCUMENT);
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
      this.artifactRenderToken += 1;
      this.diagnostics = validateDocument(documentObject);
      this.render();
    }

    goToScene(nextIndex) {
      if (!this.document?.scenes?.length) {
        return;
      }
      this.sceneIndex = clamp(nextIndex, 0, this.document.scenes.length - 1);
      this.selected = null;
      this.artifactRenderToken += 1;
      this.render();
    }

    render() {
      this.renderDocumentHeader();
      this.renderSceneList();
      this.renderScene();
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
        button.textContent = String(index + 1);
        button.setAttribute("aria-label", `${index + 1}. ${scene.title || scene.id}`);
        button.title = scene.title || scene.id;
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
        return;
      }

      this.dom["scene-kicker"].textContent = `Scene ${this.sceneIndex + 1} · ${scene.id}`;
      this.dom["scene-title"].textContent = scene.title || scene.id;
      this.renderVisual(scene);
      this.renderNarration(scene);
      this.renderArtifacts(scene);
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
      const focusedRelationshipIds = new Set(
        (scene.focus ?? [])
          .filter((focus) => focus.target.kind === "relationship")
          .map((focus) => focus.target.id)
      );
      const focusIds = new Set(Array.from(focusClasses.keys()));
      const hasFocus = focusIds.size > 0;
      const relationshipsLayer = svgEl("g", { class: "relationships-layer" });
      const elementsLayer = svgEl("g", { class: "elements-layer" });
      const endpointPlans = buildRelationshipEndpointPlans(visual, this.positionsById);

      for (const [relationshipIndex, relationship] of (visual.relationships ?? []).entries()) {
        const showLabel = shouldShowRelationshipLabel(visual, relationship, focusedRelationshipIds);
        const node = this.renderRelationship(relationship, focusClasses, hasFocus, relationshipIndex, showLabel, endpointPlans.get(relationship.id));
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

    renderRelationship(relationship, focusClasses, hasFocus, relationshipIndex = 0, showLabel = true, endpointPlan = null) {
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

      const pathKind = endpointPlan?.pathKind ?? relationship.path ?? defaultRelationshipPath(this.currentScene()?.visual, from, to);
      const { start, end, route } = endpointPlan ?? relationshipEndpoints(pathKind, from, to);
      const path = svgEl("path", {
        class: "relationship-line",
        d: relationshipPath(pathKind, start, end, route, endpointPlan),
        "stroke-width": lineWeight(relationship.line?.weight),
        "stroke-dasharray": lineDash(relationship.line?.pattern),
        "marker-start": markerUrl(relationship.startDecoration),
        "marker-end": markerUrl(relationship.endDecoration)
      });
      group.appendChild(path);

      if (relationship.label && showLabel) {
        const mid = relationshipMidpoint(pathKind, start, end, relationshipIndex);
        addRelationshipLabel(group, relationship.label, mid);
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

    async renderArtifacts(scene) {
      const artifacts = scene.artifacts ?? [];
      if (!artifacts.length) {
        replaceChildren(this.dom["artifact-panel"], emptySmall("No artifacts for this scene."));
        return;
      }

      const renderToken = this.artifactRenderToken;
      replaceChildren(
        this.dom["artifact-panel"],
        ...artifacts.map((artifact) => renderArtifactSummary(artifact, emptySmall("Loading artifact content.")))
      );

      const items = await Promise.all(artifacts.map((artifact) => this.renderArtifactItem(artifact)));
      if (renderToken !== this.artifactRenderToken) {
        return;
      }
      replaceChildren(this.dom["artifact-panel"], ...items);
    }

    async renderArtifactItem(artifact) {
      try {
        const text = await this.fetchArtifactText(artifact.locator);
        return renderArtifactSummary(artifact, renderTextExcerpt(text, artifact.locator));
      } catch (error) {
        return renderArtifactSummary(artifact, emptySmall(error.message));
      }
    }

    async fetchArtifactText(locator) {
      const url = artifactPreviewUrl(locator);
      if (!url) {
        throw new Error("No readable text location.");
      }
      if (this.artifactTextCache.has(url)) {
        return this.artifactTextCache.get(url);
      }
      const response = await fetch(url);
      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Could not load ${locatorFileName(locator)}.`);
      }
      const text = await response.text();
      this.artifactTextCache.set(url, text);
      return text;
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
      if (artifact.locator?.kind === "filePath" && !isAbsoluteLocalPath(artifact.locator.path)) {
        diagnostics.push(diagnostic("relative_file_path", `${artifactPath}/locator/path`, "filePath locators must use absolute local paths."));
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
    const bounds = layout.bounds ?? defaultBounds(elements.length);
    const positions = new Map();
    const manual = layout.strategy === "manual" || elements.some((item) => item.geometry?.x !== undefined || item.geometry?.y !== undefined);

    if (manual) {
      for (const elementObject of elements) {
        positions.set(elementObject.id, normalizeBox(elementObject.geometry, bounds));
      }
      return { positions, bounds };
    }

    const direction = layout.direction ?? defaultDirection(visual.kind);
    if (layout.strategy === "layered" || layout.strategy === "auto" && ["graph", "flow"].includes(visual.kind)) {
      layoutLayered(elements, visual.relationships ?? [], positions, bounds, direction);
    } else if (visual.kind === "timeline") {
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
    const width = geometry.width ?? 170;
    const height = geometry.height ?? 86;
    return {
      x: geometry.x ?? bounds.x,
      y: geometry.y ?? bounds.y,
      width,
      height
    };
  }

  function defaultBounds(elementCount) {
    return {
      x: 40,
      y: 40,
      width: Math.max(980, elementCount * 190),
      height: Math.max(580, Math.ceil(elementCount / 2) * 150)
    };
  }

  function layoutLinear(elements, positions, bounds, direction) {
    const horizontal = direction === "leftToRight" || direction === "rightToLeft";
    const count = Math.max(elements.length, 1);
    elements.forEach((elementObject, index) => {
      const order = direction === "rightToLeft" || direction === "bottomToTop" ? count - index - 1 : index;
      const width = elementObject.geometry?.width ?? 220;
      const height = elementObject.geometry?.height ?? 104;
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
      const width = elementObject.geometry?.width ?? 210;
      const height = elementObject.geometry?.height ?? 96;
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
      const width = elementObject.geometry?.width ?? Math.min(220, cellWidth * 0.72);
      const height = elementObject.geometry?.height ?? Math.min(104, cellHeight * 0.62);
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
      const width = elementObject.geometry?.width ?? 210;
      const height = elementObject.geometry?.height ?? 98;
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(elements.length, 1);
      positions.set(elementObject.id, {
        x: center.x + Math.cos(angle) * radius - width / 2,
        y: center.y + Math.sin(angle) * radius - height / 2,
        width,
        height
      });
    });
  }

  function layoutLayered(elements, relationships, positions, bounds, direction) {
    const ids = new Set(elements.map((item) => item.id));
    const depths = assignRelationshipDepths(elements, relationships);
    const buckets = new Map();
    for (const item of elements) {
      const bucket = buckets.get(depths.get(item.id) ?? 0) ?? [];
      bucket.push(item);
      buckets.set(depths.get(item.id) ?? 0, bucket);
    }

    const horizontal = direction === "leftToRight" || direction === "rightToLeft";
    const reverse = direction === "rightToLeft" || direction === "bottomToTop";
    const orderedDepths = Array.from(buckets.keys()).sort((a, b) => a - b);
    const maxDepth = Math.max(...orderedDepths, 0);
    const maxBucket = Math.max(...Array.from(buckets.values()).map((bucket) => bucket.length), 1);
    const elementWidth = 220;
    const elementHeight = 104;
    const primaryGap = horizontal
      ? Math.max(250, (bounds.width - elementWidth) / Math.max(maxDepth, 1))
      : Math.max(170, (bounds.height - elementHeight) / Math.max(maxDepth, 1));
    const secondaryGap = horizontal
      ? Math.max(140, (bounds.height - elementHeight) / Math.max(maxBucket - 1, 1))
      : Math.max(240, (bounds.width - elementWidth) / Math.max(maxBucket - 1, 1));

    for (const depth of orderedDepths) {
      const bucket = buckets.get(depth) ?? [];
      bucket.forEach((item, index) => {
        const width = item.geometry?.width ?? elementWidth;
        const height = item.geometry?.height ?? elementHeight;
        const depthOrder = reverse ? maxDepth - depth : depth;
        const centeredIndex = index - (bucket.length - 1) / 2;
        const primary = horizontal
          ? bounds.x + depthOrder * primaryGap
          : bounds.y + depthOrder * primaryGap;
        const secondaryCenter = horizontal
          ? bounds.y + bounds.height / 2 + centeredIndex * secondaryGap
          : bounds.x + bounds.width / 2 + centeredIndex * secondaryGap;

        positions.set(item.id, {
          x: horizontal ? primary : secondaryCenter - width / 2,
          y: horizontal ? secondaryCenter - height / 2 : primary,
          width,
          height
        });
      });
    }

    for (const item of elements) {
      if (!ids.has(item.id) || positions.has(item.id)) {
        continue;
      }
      positions.set(item.id, normalizeBox(item.geometry, bounds));
    }
  }

  function assignRelationshipDepths(elements, relationships) {
    const ids = new Set(elements.map((item) => item.id));
    const order = new Map(elements.map((item, index) => [item.id, index]));
    const depths = new Map(elements.map((item) => [item.id, 0]));
    const validRelationships = relationships.filter((relationship) => {
      if (!ids.has(relationship.from) || !ids.has(relationship.to)) {
        return false;
      }
      return (order.get(relationship.to) ?? 0) > (order.get(relationship.from) ?? 0);
    });

    for (let pass = 0; pass < elements.length; pass += 1) {
      let changed = false;
      for (const relationship of validRelationships) {
        const fromDepth = depths.get(relationship.from) ?? 0;
        const toDepth = depths.get(relationship.to) ?? 0;
        if (toDepth <= fromDepth && fromDepth < elements.length - 1) {
          depths.set(relationship.to, fromDepth + 1);
          changed = true;
        }
      }
      if (!changed) {
        break;
      }
    }

    const maxUsefulDepth = Math.max(1, Math.min(elements.length - 1, 5));
    for (const [id, depth] of depths.entries()) {
      depths.set(id, Math.min(depth, maxUsefulDepth));
    }
    return depths;
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
    const padding = viewport.padding ?? 36;
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
      : displayLabel(elementObject.label || elementObject.id);
    const lines = wrapLabel(String(label), Math.max(8, Math.floor(box.width / 11)));
    const lineHeight = 15;
    const startY = box.y + box.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      group.appendChild(svgEl("text", { class: "element-label", x: box.x + box.width / 2, y: startY + index * lineHeight }, line));
    });
  }

  function addRelationshipLabel(group, label, mid) {
    const lines = wrapLabel(String(label), 24).slice(0, 3);
    const lineHeight = 13;
    const width = Math.min(188, Math.max(56, Math.max(...lines.map((line) => line.length), 1) * 7 + 18));
    const height = lines.length * lineHeight + 10;
    group.appendChild(svgEl("rect", {
      class: "relationship-label-bg",
      x: mid.x - width / 2,
      y: mid.y - height / 2,
      width,
      height,
      rx: 4
    }));
    const startY = mid.y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      group.appendChild(svgEl("text", {
        class: "relationship-label",
        x: mid.x,
        y: startY + index * lineHeight
      }, line));
    });
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

  function defaultRelationshipPath(visual, from, to) {
    if (visual?.layout?.strategy === "layered") {
      return Math.abs(centerOf(from).x - centerOf(to).x) > Math.abs(centerOf(from).y - centerOf(to).y)
        ? "orthogonal"
        : "curved";
    }
    return "straight";
  }

  function buildRelationshipEndpointPlans(visual, positions) {
    const plans = new Map();
    const portGroups = new Map();
    for (const relationship of visual.relationships ?? []) {
      const from = positions.get(relationship.from);
      const to = positions.get(relationship.to);
      if (!from || !to) {
        continue;
      }

      const pathKind = relationship.path ?? defaultRelationshipPath(visual, from, to);
      const plan = relationshipEndpointPlan(pathKind, from, to);
      plans.set(relationship.id, plan);
      reservePort(portGroups, relationship.from, from, plan.startSide, centerOf(to), plan, "start");
      reservePort(portGroups, relationship.to, to, plan.endSide, centerOf(from), plan, "end");
    }

    for (const group of portGroups.values()) {
      group.sort((a, b) => a.desired - b.desired || a.order - b.order);
      group.forEach((entry, index) => {
        entry.plan[entry.endpoint] = distributedSidePort(entry.box, entry.side, index, group.length);
      });
    }
    assignOrthogonalBendLanes(plans);

    return plans;
  }

  function relationshipEndpointPlan(kind, from, to) {
    if (kind !== "orthogonal") {
      const startSide = sideFacingPoint(from, centerOf(to));
      const endSide = sideFacingPoint(to, centerOf(from));
      return {
        pathKind: kind,
        start: sidePort(from, startSide),
        end: sidePort(to, endSide),
        startSide,
        endSide,
        route: "direct"
      };
    }

    const route = chooseOrthogonalRoute(from, to);
    const fromCenter = centerOf(from);
    const toCenter = centerOf(to);
    if (route === "horizontalFirst") {
      const movingRight = toCenter.x >= fromCenter.x;
      const startSide = movingRight ? "right" : "left";
      const endSide = movingRight ? "left" : "right";
      return {
        pathKind: kind,
        start: sidePort(from, startSide),
        end: sidePort(to, endSide),
        startSide,
        endSide,
        route
      };
    }

    const movingDown = toCenter.y >= fromCenter.y;
    const startSide = movingDown ? "bottom" : "top";
    const endSide = movingDown ? "top" : "bottom";
    return {
      pathKind: kind,
      start: sidePort(from, startSide),
      end: sidePort(to, endSide),
      startSide,
      endSide,
      route
    };
  }

  function reservePort(portGroups, elementId, box, side, toward, plan, endpoint) {
    const key = `${elementId}:${side}`;
    const group = portGroups.get(key) ?? [];
    group.push({
      box,
      desired: side === "left" || side === "right" ? toward.y : toward.x,
      endpoint,
      order: group.length,
      plan,
      side
    });
    portGroups.set(key, group);
  }

  function assignOrthogonalBendLanes(plans) {
    const horizontalSegments = [];
    const verticalSegments = [];
    for (const plan of plans.values()) {
      if (plan.pathKind !== "orthogonal") {
        continue;
      }
      if (plan.route === "horizontalFirst") {
        plan.bendX = (plan.start.x + plan.end.x) / 2;
        horizontalSegments.push({
          axis: plan.bendX,
          crossEnd: Math.max(plan.start.y, plan.end.y),
          crossStart: Math.min(plan.start.y, plan.end.y),
          plan
        });
      } else if (plan.route === "verticalFirst") {
        plan.bendY = (plan.start.y + plan.end.y) / 2;
        verticalSegments.push({
          axis: plan.bendY,
          crossEnd: Math.max(plan.start.x, plan.end.x),
          crossStart: Math.min(plan.start.x, plan.end.x),
          plan
        });
      }
    }

    assignSegmentLanes(horizontalSegments, "bendX");
    assignSegmentLanes(verticalSegments, "bendY");
  }

  function assignSegmentLanes(segments, propertyName) {
    const groups = overlappingSegmentGroups(segments);
    for (const group of groups) {
      if (group.length <= 1) {
        continue;
      }
      group
        .sort((a, b) => a.crossStart - b.crossStart || a.crossEnd - b.crossEnd || a.axis - b.axis)
        .forEach((segment, index) => {
          segment.plan[propertyName] = segment.axis + centeredLaneOffset(index, group.length, 16);
        });
    }
  }

  function overlappingSegmentGroups(segments) {
    const groups = [];
    const remaining = [...segments].sort((a, b) => a.axis - b.axis || a.crossStart - b.crossStart);
    while (remaining.length) {
      const group = [remaining.shift()];
      let grew = true;
      while (grew) {
        grew = false;
        for (let index = remaining.length - 1; index >= 0; index -= 1) {
          if (group.some((candidate) => segmentsNeedSeparateLanes(candidate, remaining[index]))) {
            group.push(remaining.splice(index, 1)[0]);
            grew = true;
          }
        }
      }
      groups.push(group);
    }
    return groups;
  }

  function segmentsNeedSeparateLanes(a, b) {
    return Math.abs(a.axis - b.axis) < 24 && rangesOverlap(a.crossStart, a.crossEnd, b.crossStart, b.crossEnd);
  }

  function rangesOverlap(startA, endA, startB, endB) {
    return Math.min(endA, endB) - Math.max(startA, startB) > 8;
  }

  function centeredLaneOffset(index, count, gap) {
    return (index - (count - 1) / 2) * gap;
  }

  function relationshipEndpoints(kind, from, to) {
    if (kind !== "orthogonal") {
      return {
        start: edgePoint(from, centerOf(to)),
        end: edgePoint(to, centerOf(from)),
        route: "direct"
      };
    }

    const route = chooseOrthogonalRoute(from, to);
    const fromCenter = centerOf(from);
    const toCenter = centerOf(to);
    if (route === "horizontalFirst") {
      const movingRight = toCenter.x >= fromCenter.x;
      return {
        start: sidePort(from, movingRight ? "right" : "left"),
        end: sidePort(to, movingRight ? "left" : "right"),
        route
      };
    }

    const movingDown = toCenter.y >= fromCenter.y;
    return {
      start: sidePort(from, movingDown ? "bottom" : "top"),
      end: sidePort(to, movingDown ? "top" : "bottom"),
      route
    };
  }

  function chooseOrthogonalRoute(from, to) {
    const fromCenter = centerOf(from);
    const toCenter = centerOf(to);
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const horizontalThreshold = Math.min(from.width, to.width) * 0.28;
    const verticalThreshold = Math.min(from.height, to.height) * 0.35;

    if (Math.abs(dx) <= horizontalThreshold && Math.abs(dy) > verticalThreshold) {
      return "verticalFirst";
    }
    return "horizontalFirst";
  }

  function sideFacingPoint(box, point) {
    const center = centerOf(box);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const xScale = Math.abs(dx) / (box.width / 2 || 1);
    const yScale = Math.abs(dy) / (box.height / 2 || 1);
    if (xScale >= yScale) {
      return dx >= 0 ? "right" : "left";
    }
    return dy >= 0 ? "bottom" : "top";
  }

  function sidePort(box, side) {
    const center = centerOf(box);
    if (side === "left") {
      return { x: box.x, y: center.y };
    }
    if (side === "right") {
      return { x: box.x + box.width, y: center.y };
    }
    if (side === "top") {
      return { x: center.x, y: box.y };
    }
    return { x: center.x, y: box.y + box.height };
  }

  function distributedSidePort(box, side, index, count) {
    if (count <= 1) {
      return sidePort(box, side);
    }

    const isVerticalSide = side === "left" || side === "right";
    const span = isVerticalSide ? box.height : box.width;
    const padding = Math.min(22, Math.max(10, span * 0.2));
    const usableSpan = Math.max(1, span - padding * 2);
    const offset = padding + usableSpan * ((index + 1) / (count + 1));
    if (side === "left") {
      return { x: box.x, y: box.y + offset };
    }
    if (side === "right") {
      return { x: box.x + box.width, y: box.y + offset };
    }
    if (side === "top") {
      return { x: box.x + offset, y: box.y };
    }
    return { x: box.x + offset, y: box.y + box.height };
  }

  function relationshipPath(kind, start, end, route = "direct", plan = null) {
    if (kind === "orthogonal") {
      if (route === "verticalFirst") {
        const midY = plan?.bendY ?? (start.y + end.y) / 2;
        return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
      }
      const midX = plan?.bendX ?? (start.x + end.x) / 2;
      return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    }
    if (kind === "curved") {
      const dx = end.x - start.x;
      return `M ${start.x} ${start.y} C ${start.x + dx * 0.38} ${start.y - 48}, ${end.x - dx * 0.38} ${end.y + 48}, ${end.x} ${end.y}`;
    }
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  function relationshipMidpoint(kind, start, end, relationshipIndex = 0) {
    const laneOffset = ((relationshipIndex % 3) - 1) * 14;
    if (kind === "orthogonal") {
      return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 + laneOffset };
    }
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - (kind === "curved" ? 24 : 0) + laneOffset };
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

  function shouldShowRelationshipLabel(visual, relationship, focusedRelationshipIds) {
    const relationshipCount = visual.relationships?.length ?? 0;
    return relationshipCount <= 3 || focusedRelationshipIds.has(relationship.id);
  }

  function renderArtifactCitation(locator) {
    if (!locator) {
      return el("p", { className: "locator artifact-citation", text: "No file location." });
    }

    const fileName = locatorFileName(locator);
    const wrapper = el("p", { className: "locator artifact-citation" });
    if (locator.kind === "filePath" || locator.kind === "fileUrl" || locator.kind === "url") {
      const href = locator.kind === "filePath"
        ? filePathToUrl(locator.path)
        : locator.kind === "url" && locator.fragment
          ? `${locator.url}#${locator.fragment}`
          : locator.url;
      const link = el("a", { href, text: fileName });
      link.target = "_blank";
      link.rel = "noreferrer";
      wrapper.appendChild(link);
    } else {
      wrapper.append(fileName);
    }

    if (locator.range) {
      wrapper.append(` · lines ${locator.range.startLine}-${locator.range.endLine}`);
    }
    return wrapper;
  }

  function renderArtifactSummary(artifact, content) {
    const item = el("article", { className: "artifact-item" });
    item.appendChild(el("strong", { text: artifact.title || artifact.id }));
    item.appendChild(renderArtifactCitation(artifact.locator));
    item.appendChild(content);
    return item;
  }

  function renderTextExcerpt(text, locator) {
    const lines = String(text).replace(/\r\n/g, "\n").split("\n");
    const range = normalizedRange(locator?.range, lines.length);
    const startLine = range ? Math.max(1, range.startLine - 4) : 1;
    const endLine = range ? Math.min(lines.length, range.endLine + 4) : Math.min(lines.length, 80);
    const wrapper = el("div", { className: "artifact-content" });
    const excerptLabel = range
      ? `Excerpt, lines ${startLine}-${endLine}`
      : `Preview, first ${endLine} lines`;
    wrapper.appendChild(el("p", { className: "artifact-content-label", text: excerptLabel }));
    const code = el("div", { className: "code-excerpt", role: "region", "aria-label": excerptLabel });
    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber += 1) {
      const isHighlighted = range && lineNumber >= range.startLine && lineNumber <= range.endLine;
      const row = el("div", { className: `code-line${isHighlighted ? " highlighted" : ""}` });
      row.appendChild(el("span", { className: "line-number", text: String(lineNumber) }));
      row.appendChild(el("code", { text: lines[lineNumber - 1] ?? "" }));
      code.appendChild(row);
    }
    wrapper.appendChild(code);
    return wrapper;
  }

  function normalizedRange(range, lineCount) {
    if (!range || !lineCount) {
      return null;
    }
    const startLine = clamp(Number(range.startLine) || 1, 1, lineCount);
    const endLine = clamp(Number(range.endLine) || startLine, startLine, lineCount);
    return { startLine, endLine };
  }

  function artifactPreviewUrl(locator) {
    if (!locator) {
      return null;
    }
    const localPath = localPathForLocator(locator);
    if (localPath && shouldUseLocalArtifactEndpoint()) {
      return `/__explainer_artifact?path=${encodeURIComponent(localPath)}`;
    }
    if (locator.kind === "filePath" && locator.path) {
      return filePathToUrl(locator.path);
    }
    if (locator.kind === "fileUrl" && locator.url) {
      return locator.url;
    }
    if (locator.kind === "url" && locator.url) {
      return locator.url;
    }
    return null;
  }

  function localPathForLocator(locator) {
    if (locator.kind === "filePath" && locator.path) {
      return locator.path;
    }
    if (locator.kind === "fileUrl" && locator.url) {
      return fileUrlToPath(locator.url);
    }
    return null;
  }

  function shouldUseLocalArtifactEndpoint() {
    return window.location.protocol === "http:" || window.location.protocol === "https:";
  }

  function fileUrlToPath(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "file:") {
        return null;
      }
      const path = decodeURIComponent(parsed.pathname);
      if (/^\/[A-Za-z]:[\\/]/.test(path)) {
        return path.slice(1);
      }
      return path;
    } catch {
      return null;
    }
  }

  function filePathToUrl(path) {
    if (!path) {
      return "";
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
      return path;
    }
    if (path.startsWith("/")) {
      return new URL(`file://${path}`).href;
    }
    return path;
  }

  function isAbsoluteLocalPath(path) {
    return typeof path === "string" && (path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path));
  }

  function locatorFileName(locator) {
    if (locator.path) {
      return lastPathSegment(locator.path);
    }
    if (locator.url) {
      try {
        const url = new URL(locator.url, window.location.href);
        return lastPathSegment(url.pathname) || url.hostname || locator.url;
      } catch {
        return lastPathSegment(locator.url);
      }
    }
    return locator.kind || "Unknown source";
  }

  function lastPathSegment(value) {
    const trimmed = String(value).replace(/[#?].*$/, "").replace(/\/+$/, "");
    const segment = trimmed.split("/").filter(Boolean).pop() || trimmed;
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
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

  function wrapLabel(value, maxLength) {
    const words = value.split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
      if (word.length > maxLength) {
        if (current) {
          lines.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += maxLength) {
          lines.push(word.slice(index, index + maxLength));
        }
        continue;
      }
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

  function displayLabel(value) {
    return String(value)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/\s*\/\s*/g, " / ");
  }

  function truncate(value, maxLength) {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }

  function diagnostic(code, path, message) {
    return { code, path, message };
  }

  function emptySmall(text) {
    return el("div", { className: "empty-small", text });
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
