# ArcGIS Portal — Agent Plugins 1.0.0

Reads and queries an ArcGIS Enterprise Portal: item discovery, layer inspection, SQL-92 feature
queries, aggregations, geocoding, map export.

Conforms to [Agent Plugins 1.0.0](https://agent-plugins.org/specification) — the vendor-neutral
format published by Amazon, Cursor, Microsoft, OpenAI and Vercel on 6 August 2026. Loads in ChatGPT,
Codex, Cursor, GitHub Copilot, Kiro and VS Code.

> **Not for Claude Code.** Claude Code (2.1.263) does not implement this spec — it reads
> `.claude-plugin/plugin.json` and `.mcp.json` instead. The Claude Code build of the same integration
> is in `../../plugins/arcgis-portal/`. See
> [Claude Code](#claude-code) below for what actually happens if you point Claude Code at this folder.

## Contents

```
arcgis-portal/
├── plugin.json                    # manifest, schema 1.0.0
├── mcp.json                       # the arcgis MCP server, stdio transport
├── bin/arcgis-mcp.mjs             # stdio → streamable-http bridge
├── skills/
│   ├── portal-inventory/SKILL.md  # what can be read, with layer IDs
│   ├── layer-query/SKILL.md       # describe-then-query discipline, counting traps
│   └── layer-report/SKILL.md      # Markdown inventory report
├── README.md
└── CHANGELOG.md
```

## Install

Point your client at this directory — each one has its own mechanism, since v1 defines no registry
and no install command. Then set the endpoint in the environment the client launches the plugin from:

```bash
export ARCGIS_MCP_URL="https://portal.example.com/arcgis/platform/mcp"
export ARCGIS_MCP_TOKEN="AAPT..."      # optional if the URL already carries ?token=
```

Requires Node.js and, on first run, network access to npm.

## Why stdio instead of streamable-http

The endpoint needs a per-user ArcGIS token, and v1 has nowhere conformant to put one:

- "Header values are visible package data, not a portable secret mechanism. Plugins MUST NOT embed
  credentials or other secrets in `headers`." The same sentence appears for `env`.
- "Agent Plugins v1 defines no OAuth configuration or portable credential-reference fields.
  Authorization discovery, user interaction, and credential storage are client-managed."
- Only `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` expand, and only in `args`, `env` and `cwd` — never in
  `url` or `headers`.

So a `streamable-http` server here would mean either a hardcoded token in the package or a broken
plugin. Instead `mcp.json` declares a `stdio` server that runs `bin/arcgis-mcp.mjs`, which reads the
endpoint from the environment at launch and bridges stdio to the remote endpoint via `mcp-remote`.

The bridge:

- refuses anything that is not `https:`, and fails with a usable message when `ARCGIS_MCP_URL` is unset
- appends `ARCGIS_MCP_TOKEN` as `?token=` only when the URL does not already carry one
- writes nothing to stdout — that stream carries the MCP protocol — and logs only the host, never the token
- caches bridge state under `${PLUGIN_DATA}`, so it survives plugin updates
- forwards `SIGINT` / `SIGTERM` and propagates the child exit code

Override the bridge version with `ARCGIS_MCP_PROXY=mcp-remote@x.y.z` (default `mcp-remote@0.8.5`).

## Validate

```bash
npx ajv-cli validate --spec=draft2020 -s plugin.schema.json -d plugin.json
npx ajv-cli validate --spec=draft2020 -s mcp.schema.json    -d mcp.json
npx skills-ref validate ./skills/portal-inventory
```

Schemas live at `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` and
`.../mcp.schema.json`. Both are closed: `plugin.json` permits exactly `$schema`, `name`, `version`,
`description`, `author`, `homepage`, `repository`, `license`, `keywords`, `extensions` — nothing else.
Client-specific data belongs under `extensions` with a reverse-domain namespace.

`@agentplugins/cli` on npm is a third-party toolchain that wants its own `agentplugins.config.ts`; it
is not the spec validator and will error on a conformant plugin.

## What the server exposes

| Tool | Purpose |
| --- | --- |
| `search_portal_content` | Item discovery. **Only items tagged with the exposure tag are returned** — the filter is injected server-side. |
| `get_search_portal_content_passthrough_instructions` | Raw `q` syntax, for OR / NOT / nested queries. |
| `describe_item` | Item metadata; service definition for service items, `/data` for web maps and dashboards. |
| `describe_layer` | Fields, Esri types, sample values, extent, spatial reference. Takes the **service** URL plus a `layerId`. |
| `query_data` | Records, counts, grouped statistics. Takes the **layer** URL. Requires `describe_layer` first. |
| `find_address_candidates` / `reverse_geocode` | Geocoding both directions. |
| `get_map_image` | Map export. |
| `get_gp_task_definition` / `get_gp_task_job_status` | Geoprocessing tasks. |

Availability depends on the authenticated account and on what the deployment has enabled.

## Scoping model

The MCP server is deliberately narrow: an item is invisible to the agent until a Portal admin adds
the exposure tag (`mcp` by default). Widening access is a Portal-side tagging decision, not a plugin
setting. The skills are written to report that scope honestly — an empty result is described as
"nothing is tagged", never as "the portal has no such data".

## Claude Code

If you do point Claude Code at this directory, it loads as a plugin whose name comes from the folder,
and the three skills work — Claude Code treats `skills/` as a default component location and the
manifest as optional. But `plugin.json` and `mcp.json` are ignored, so **the ArcGIS MCP server never
starts** and the skills have no tools to call. Use the Claude Code build instead.

## Limits of v1

- **No agents.** v1 packages skills and MCP servers only. The `gis-analyst` subagent exists only in
  the Claude Code build.
- **No configuration prompting.** No `userConfig` equivalent; credentials are the client's business.
- **No distribution.** No registry, no install command, no marketplace. "Portable" means a conformant
  client can load this directory, not that anyone can discover it.

## Security notes

- No credential is stored in any file here. The endpoint and token are read from the environment at
  launch, per the spec's own guidance.
- ArcGIS tokens expire. Refresh the environment variable — never patch a token into the package.
- Read access only. No editing tool.
