#!/usr/bin/env node
// stdio launcher for the ArcGIS platform MCP endpoint.
//
// Agent Plugins 1.0.0 states that mcp.json `env` and `headers` values are visible
// package data and MUST NOT carry credentials, and it defines no portable way to
// reference a client-managed secret. So the endpoint is read from the environment
// at launch instead of being written into the package, and this process bridges
// the plugin's stdio transport to the remote streamable-http endpoint.
//
// Required:
//   ARCGIS_MCP_URL    https URL of the endpoint, e.g.
//                     https://portal.example.com/arcgis/platform/mcp
// Optional:
//   ARCGIS_MCP_TOKEN  ArcGIS token, appended as ?token= when the URL has none
//   ARCGIS_MCP_PROXY  npm spec of the bridge (default: mcp-remote@0.8.5)
//
// Nothing is ever written to stdout: that stream carries the MCP protocol.

import { spawn } from "node:child_process";

const fail = (message) => {
  process.stderr.write(`arcgis-portal: ${message}\n`);
  process.exit(1);
};

const raw = (process.env.ARCGIS_MCP_URL ?? "").trim();
if (!raw) {
  fail(
    "ARCGIS_MCP_URL is not set. Point it at your ArcGIS platform MCP endpoint, " +
      "for example https://portal.example.com/arcgis/platform/mcp — and keep the " +
      "token in ARCGIS_MCP_TOKEN or in the URL, never in the plugin files."
  );
}

let endpoint;
try {
  endpoint = new URL(raw);
} catch {
  fail(`ARCGIS_MCP_URL is not a valid URL (host: ${raw.slice(0, 40)}…).`);
}

if (endpoint.protocol !== "https:") {
  fail(`ARCGIS_MCP_URL must use https, got ${endpoint.protocol.replace(":", "")}.`);
}

const token = (process.env.ARCGIS_MCP_TOKEN ?? "").trim();
if (token && !endpoint.searchParams.has("token")) {
  endpoint.searchParams.set("token", token);
}

// Diagnostics name the host only — the token must not reach the log.
process.stderr.write(`arcgis-portal: connecting to ${endpoint.host}\n`);

const proxy = (process.env.ARCGIS_MCP_PROXY ?? "mcp-remote@0.8.5").trim();
const args = ["--yes", proxy, endpoint.toString(), "--transport", "http-first"];

const child = spawn("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    MCP_REMOTE_CONFIG_DIR: process.env.ARCGIS_MCP_CACHE_DIR ?? process.env.MCP_REMOTE_CONFIG_DIR,
  },
});

child.on("error", (error) => fail(`could not start the MCP bridge: ${error.message}`));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
