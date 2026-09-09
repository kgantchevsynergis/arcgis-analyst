# Changelog

## 1.0.0 — 2026-09-08

Initial release. Agent Plugins 1.0.0 format.

- `plugin.json` — root manifest, validated against
  `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`
- `mcp.json` — `arcgis` server, `stdio` transport, `${PLUGIN_ROOT}` / `${PLUGIN_DATA}` for the bridge
  path and its cache directory
- `bin/arcgis-mcp.mjs` — stdio to streamable-http bridge. Reads `ARCGIS_MCP_URL` and
  `ARCGIS_MCP_TOKEN` from the environment, because the spec forbids credentials in `env` and
  `headers` and defines no portable credential reference. Requires HTTPS, keeps the token out of
  every log line, forwards signals, propagates the exit code.
- Skill `portal-inventory` — permission-scoped list of readable items, services and layer IDs
- Skill `layer-query` — the describe-then-query workflow, server-side aggregation, and the
  layer-name-versus-content check before quoting a count
- Skill `layer-report` — Markdown inventory report with field reference and reproducible queries
- All three skills validate with `skills-ref` against the Agent Skills specification

Split out of the initial dual-format directory: the Claude Code build of the same integration lives
in `plugins/arcgis-portal/`.
