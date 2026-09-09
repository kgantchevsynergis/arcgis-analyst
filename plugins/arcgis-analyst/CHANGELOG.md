# Changelog

## 1.0.0 — 2026-09-08

Initial release. Claude Code plugin format.

- `.claude-plugin/plugin.json` — manifest with one `userConfig` option, `mcp_endpoint` (declared
  sensitive, required). Nothing else is configurable: `${user_config.*}` does not substitute into
  skill body text in practice, so a tag option could only have been documentation, and the skills
  read the real exposure tag off the `tags` array of the items they retrieve instead.
- `.mcp.json` — `arcgis` server over HTTP, URL from `${user_config.mcp_endpoint}`
- `.claude-plugin/marketplace.json` at the repository root — marketplace `synergis-gis`
- Skill `portal-inventory` — permission-scoped list of readable items, services and layer IDs
- Skill `layer-query` — the describe-then-query workflow, server-side aggregation, and the
  layer-name-versus-content check before quoting a count
- Skill `layer-report` — Markdown inventory report with field reference and reproducible queries
- Agent `gis-analyst` — read-only, restricted to the ArcGIS read tools plus local file tools

Split out of the initial dual-format directory: the Agent Plugins 1.0.0 build of the same
integration now lives in its own repository, since Claude Code does not read that format.
