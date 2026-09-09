# arcgis-analyst

A Claude Code plugin marketplace for reading an **ArcGIS Enterprise Portal**: item discovery, layer
inspection, SQL-92 feature queries, aggregations, geocoding and map export — plus the workflow
knowledge an agent needs to use the ArcGIS MCP server without inventing field names.

The repository root is the marketplace, so installing takes two commands:

```bash
claude plugin marketplace add kgantchevsynergis/arcgis-analyst
claude plugin install arcgis-analyst@synergis-gis
```

If the repository is private, add it by full HTTPS URL instead — the `owner/repo` shorthand clones
over SSH, and Claude Code runs git non-interactively:

```bash
claude plugin marketplace add https://github.com/kgantchevsynergis/arcgis-analyst.git
```

## What the plugin provides

| Component | |
| --- | --- |
| MCP server | `arcgis` over HTTP, endpoint supplied per install |
| Skills | `portal-inventory`, `layer-query`, `layer-report` |
| Agent | `gis-analyst` — read-only, for multi-step analysis |

On enable, Claude Code prompts for the **ArcGIS MCP endpoint** — the full HTTPS URL of the platform
MCP endpoint including any `?token=` parameter. It is declared `sensitive`, so it goes to the OS
secure store rather than `settings.json`, and no credential is ever committed here. The optional
**Portal home URL** and **Exposure tag** (default `mcp`) round out the configuration.

Full documentation, tool list and read-only permission allowlist: [`plugins/arcgis-analyst/README.md`](plugins/arcgis-analyst/README.md).

## Skills

The skills carry the operational knowledge, not just the tools:

| Skill | What it encodes |
| --- | --- |
| `portal-inventory` | Which items, services and layers are actually readable. The MCP server only returns items carrying the exposure tag, so an empty result means *nothing is tagged* — never "the portal has no such data". Keeps real layer IDs, including gaps. |
| `layer-query` | `describe_layer` before `query_data`, every time. The URL asymmetry (service URL + `layerId` vs. layer URL). Server-side aggregation. And the counting trap: a layer named `Trinkbrunnen` held 2,382 records across 16 `typ_text` values, so quote the total *and* the breakdown. |
| `layer-report` | A Markdown inventory report with a field reference and the queries that produced each number. |

## Layout

```
arcgis-analyst/
├── .claude-plugin/marketplace.json     # marketplace: synergis-gis
└── plugins/arcgis-analyst/
    ├── .claude-plugin/plugin.json      # manifest, userConfig
    ├── .mcp.json                       # the arcgis HTTP server
    ├── skills/{portal-inventory,layer-query,layer-report}/SKILL.md
    ├── agents/gis-analyst.md
    └── README.md · CHANGELOG.md
```

Only `plugin.json` belongs inside `.claude-plugin/`; every other component sits at the plugin root.

## Validate

```bash
claude plugin validate .                       # marketplace + every plugin in it
claude plugin validate ./plugins/arcgis-analyst
```

## Agent Plugins 1.0.0

A build of the same integration for the cross-vendor
[Agent Plugins 1.0.0](https://agent-plugins.org/specification) standard — ChatGPT, Codex, Cursor,
GitHub Copilot, Kiro, VS Code — lives in its own repository. It is a genuinely different format
(root `plugin.json`, `mcp.json`, a stdio bridge because the spec forbids credentials in package
data), so keeping it out of this repository keeps both installable without either client tripping
over the other's files.

## Security

No credential is stored anywhere in this repository. ArcGIS tokens expire — reconfigure the plugin
rather than patching a token into the package. The plugin is read-only: no editing tool, no hook that
writes to the portal.

---

MIT.
