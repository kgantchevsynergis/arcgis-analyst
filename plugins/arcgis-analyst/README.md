# ArcGIS Analyst — Claude Code plugin

Reads and queries an ArcGIS Enterprise Portal from Claude Code: item discovery, layer inspection,
SQL-92 feature queries, aggregations, geocoding, map export. Bundles the ArcGIS MCP server together
with the workflow knowledge needed to use it correctly.

- **MCP server** — `arcgis`, HTTP transport, endpoint supplied per install
- **Skills** — `/arcgis-analyst:portal-inventory`, `/arcgis-analyst:layer-query`, `/arcgis-analyst:layer-report`
- **Agent** — `gis-analyst`, read-only, for multi-step analysis

> This is Anthropic's plugin format. The cross-vendor **Agent Plugins 1.0.0** build of the same
> integration lives in a separate repository — Claude Code does not read that format. See
> [Relationship to Agent Plugins 1.0.0](#relationship-to-agent-plugins-100).

## Install

```bash
claude plugin marketplace add kgantchevsynergis/arcgis-analyst
claude plugin install arcgis-analyst@synergis-gis
```

Claude Code prompts for one value on enable:

| Field | Required | Notes |
| --- | --- | --- |
| **ArcGIS MCP endpoint** | yes | Full HTTPS URL of the platform MCP endpoint, including any `?token=` parameter. Declared `sensitive`, so it goes to the OS secure store, not `settings.json`. |

That is the only setting. The exposure tag the server filters on is decided by the deployment, not
by the plugin, so there is nothing useful to configure here — the skills assume `mcp` and read the
real tag off the `tags` array of any item that comes back.

Endpoint shape:

```
https://<portal-host>/arcgis/platform/mcp?token=<arcgis-token>
```

Change a value later with `/plugin` → the plugin → **Configure**.

## Test before installing

```bash
claude --plugin-dir ./plugins/arcgis-analyst
```

`--plugin-dir` takes precedence over an installed copy of the same name for that session, so this is
also how you test a change to an already-installed plugin. After editing files, `/reload-plugins`
picks up the changes — including the MCP server — without restarting.

```bash
claude plugin validate .                       # marketplace + every plugin in it
claude plugin validate ./plugins/arcgis-analyst
```

## Tool names

Plugin MCP tools are namespaced. Hyphens in the plugin name become underscores:

```
mcp__plugin_arcgis_analyst_arcgis__<tool>
```

So `query_data` is `mcp__plugin_arcgis_analyst_arcgis__query_data`. Use that form in `tools:` lists,
hook matchers and permission rules. In hook `mcp_tool` server fields the address is
`plugin:arcgis-analyst:arcgis`.

Read-only allowlist for `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__plugin_arcgis_analyst_arcgis__search_portal_content",
      "mcp__plugin_arcgis_analyst_arcgis__describe_item",
      "mcp__plugin_arcgis_analyst_arcgis__describe_layer",
      "mcp__plugin_arcgis_analyst_arcgis__query_data",
      "mcp__plugin_arcgis_analyst_arcgis__find_address_candidates",
      "mcp__plugin_arcgis_analyst_arcgis__reverse_geocode"
    ]
  }
}
```

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

The MCP server is deliberately narrow: an item is invisible to Claude until a Portal admin adds the
exposure tag (`mcp` by default). Widening access is a Portal-side tagging decision, not a plugin
setting. The skills are written to report that scope honestly — an empty result is described as
"nothing is tagged", never as "the portal has no such data".

## Layout

```
arcgis-analyst/
├── .claude-plugin/plugin.json     # manifest: identity, version, userConfig
├── .mcp.json                      # the arcgis HTTP server
├── skills/
│   ├── portal-inventory/SKILL.md  # what can be read, with layer IDs
│   ├── layer-query/SKILL.md       # describe-then-query discipline, counting traps
│   └── layer-report/SKILL.md      # Markdown inventory report
├── agents/gis-analyst.md          # read-only analysis subagent
├── README.md
└── CHANGELOG.md
```

Only `plugin.json` belongs inside `.claude-plugin/`. Everything else sits at the plugin root.

## Relationship to Agent Plugins 1.0.0

Claude Code 2.1.263 does not implement the cross-vendor
[Agent Plugins 1.0.0](https://agent-plugins.org/specification) standard: it reads
`.claude-plugin/plugin.json` and `.mcp.json`, not a root `plugin.json` and `mcp.json`. Anthropic is
not a core maintainer of that spec and appears on no client list.

The two builds are deliberately kept as separate repositories rather than one hybrid:

| | This plugin | the Agent Plugins 1.0.0 build |
| --- | --- | --- |
| Manifest | `.claude-plugin/plugin.json` | `plugin.json` (root) |
| MCP config | `.mcp.json`, `type: http` | `mcp.json`, `type: stdio` + bridge |
| Credentials | `userConfig`, OS secure store | `ARCGIS_MCP_URL` / `ARCGIS_MCP_TOKEN` env vars |
| Agent | `agents/gis-analyst.md` | not in the spec |
| Skills | `skills/` | `skills/` — byte-identical copies |

The `skills/` directories are byte-identical in both repositories; keep them in sync when editing.
