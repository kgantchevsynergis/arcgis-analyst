# arcgis-analyst

Agent plugins for reading an **ArcGIS Enterprise Portal**: item discovery, layer inspection, SQL-92
feature queries, aggregations, geocoding and map export — plus the workflow knowledge an agent needs
to use the ArcGIS MCP server without inventing field names.

The same integration ships twice, because the two plugin standards are not compatible:

| | [`plugins/arcgis-portal`](plugins/arcgis-portal) | [`agent-plugins/arcgis-portal`](agent-plugins/arcgis-portal) |
| --- | --- | --- |
| Standard | Claude Code plugins | [Agent Plugins 1.0.0](https://agent-plugins.org/specification) |
| Manifest | `.claude-plugin/plugin.json` | `plugin.json` (root) |
| MCP config | `.mcp.json` — `type: http` | `mcp.json` — `type: stdio` + bridge |
| Credentials | `userConfig`, OS secure store | `ARCGIS_MCP_URL` / `ARCGIS_MCP_TOKEN` |
| Skills | 3 | the same 3 |
| Agent | `gis-analyst` | not in the spec |
| Clients | Claude Code | ChatGPT, Codex, Cursor, GitHub Copilot, Kiro, VS Code |

## Install — Claude Code

The repository root is also a Claude Code marketplace:

```bash
claude plugin marketplace add kgantchevsynergis/arcgis-analyst
claude plugin install arcgis-portal@synergis-gis
```

On enable, Claude Code prompts for the MCP endpoint (declared `sensitive`, so it lands in the OS
secure store rather than `settings.json`), an optional portal home URL, and the exposure tag.

## Install — Agent Plugins 1.0.0

Point the client at `agent-plugins/arcgis-portal`; v1 defines no registry or install command, so each
client has its own mechanism. Then set the endpoint in the environment:

```bash
export ARCGIS_MCP_URL="https://portal.example.com/arcgis/platform/mcp"
export ARCGIS_MCP_TOKEN="AAPT..."      # optional if the URL already carries ?token=
```

Requires Node.js and, on first run, network access to npm.

## Why two plugins and not one

Claude Code 2.1.263 does not implement Agent Plugins 1.0.0 — Anthropic is not a core maintainer of
that spec and appears on no client list. Pointing Claude Code at the Agent Plugins directory does
*load* the three skills (its manifest is optional when components sit in default locations, and
`skills/` is a default location in both specs), but `plugin.json` and `mcp.json` are ignored, so the
ArcGIS MCP server never starts and the skills have no tools to call.

The deeper reason is the credential. The ArcGIS platform endpoint carries a token, and Agent Plugins
1.0.0 has nowhere conformant to put one:

> "Header values are visible package data, not a portable secret mechanism. Plugins MUST NOT embed
> credentials or other secrets in `headers`."

The same sentence applies to `env`, only `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` expand, and never in
`url` or `headers`. So the Claude Code build interpolates the endpoint from secure storage into an
`http` server, while the Agent Plugins build runs a `stdio` bridge
([`bin/arcgis-mcp.mjs`](agent-plugins/arcgis-portal/bin/arcgis-mcp.mjs)) that reads the endpoint from
the environment at launch. Two different transports for the same server — not a difference that a
single file set can paper over.

## Skills

Identical in both plugins, and validated against the
[Agent Skills specification](https://agentskills.io/specification):

| Skill | What it encodes |
| --- | --- |
| `portal-inventory` | Which items, services and layers are actually readable. The MCP server only returns items carrying the exposure tag, so an empty result means *nothing is tagged* — never "the portal has no such data". Keeps real layer IDs, including gaps. |
| `layer-query` | `describe_layer` before `query_data`, every time. The URL asymmetry (service URL + `layerId` vs. layer URL). Server-side aggregation. And the counting trap: a layer named `Trinkbrunnen` held 2,382 records across 16 `typ_text` values, so quote the total *and* the breakdown. |
| `layer-report` | A Markdown inventory report with a field reference and the queries that produced each number. |

When editing a skill, edit both copies — they are byte-identical by design (`diff -r` clean).

## Layout

```
arcgis-analyst/
├── .claude-plugin/marketplace.json     # Claude Code marketplace: synergis-gis
├── plugins/arcgis-portal/              # Claude Code plugin
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── skills/{portal-inventory,layer-query,layer-report}/SKILL.md
│   └── agents/gis-analyst.md
└── agent-plugins/arcgis-portal/        # Agent Plugins 1.0.0 plugin
    ├── plugin.json
    ├── mcp.json
    ├── bin/arcgis-mcp.mjs
    └── skills/{portal-inventory,layer-query,layer-report}/SKILL.md
```

## Validate

```bash
claude plugin validate .                                  # marketplace + Claude Code plugin
npx skills-ref validate ./plugins/arcgis-portal/skills/layer-query
npx ajv-cli validate --spec=draft2020 \
  -s https://agent-plugins.org/schemas/1.0.0/plugin.schema.json \
  -d agent-plugins/arcgis-portal/plugin.json
```

`@agentplugins/cli` on npm is a third-party toolchain that expects its own `agentplugins.config.ts`;
it is not the spec validator and errors on a conformant plugin.

## Security

No credential is stored in any file in this repository, under either standard. ArcGIS tokens expire —
refresh the environment variable or reconfigure the plugin, never patch a token into the package.
Both plugins are read-only: no editing tool, no hook that writes to the portal.

---

MIT. Each plugin carries its own README and CHANGELOG.
