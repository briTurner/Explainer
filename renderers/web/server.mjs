#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || process.argv[2] || 8787);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".yaml", "text/yaml; charset=utf-8"],
  [".yml", "text/yaml; charset=utf-8"]
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    if (url.pathname === "/__explainer_artifact") {
      await serveArtifact(url, response);
      return;
    }
    await serveStatic(url, response);
  } catch (error) {
    respond(response, 500, error instanceof Error ? error.message : "Internal server error.");
  }
});

server.listen(port, host, () => {
  console.log(`Explainer web renderer listening at http://${host}:${port}/`);
});

async function serveArtifact(url, response) {
  const rawPath = url.searchParams.get("path");
  if (!rawPath) {
    respond(response, 400, "Artifact path is required.");
    return;
  }
  if (!isAbsolute(rawPath)) {
    respond(response, 400, "Artifact path must be absolute.");
    return;
  }

  let fileInfo;
  try {
    fileInfo = await stat(rawPath);
  } catch {
    respond(response, 404, "Artifact file not found.");
    return;
  }

  if (!fileInfo.isFile()) {
    respond(response, 400, "Artifact path must point to a file.");
    return;
  }

  response.writeHead(200, {
    "Content-Length": fileInfo.size,
    "Content-Type": contentTypes.get(extname(rawPath).toLowerCase()) || "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  createReadStream(rawPath).pipe(response);
}

async function serveStatic(url, response) {
  const requestedPath = decodeURIComponent(url.pathname);
  const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
  const filePath = resolve(root, normalize(relativePath));
  if (!filePath.startsWith(root)) {
    respond(response, 403, "Forbidden.");
    return;
  }

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
  } catch {
    respond(response, 404, "Not found.");
    return;
  }
  if (!fileInfo.isFile()) {
    respond(response, 404, "Not found.");
    return;
  }

  response.writeHead(200, {
    "Content-Length": fileInfo.size,
    "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
    "X-Content-Type-Options": "nosniff"
  });
  createReadStream(filePath).pipe(response);
}

function respond(response, status, message) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(message);
}
