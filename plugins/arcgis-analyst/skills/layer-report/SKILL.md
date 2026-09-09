---
name: layer-report
description: Produces a Markdown inventory report of the ArcGIS Portal — visible items, every service layer, field references and record counts — for documentation or handover. Use when the user asks for a report, an inventory, a data catalogue, documentation of the portal, or an export of what is available.
---

# Inventory report

Build a written record of the portal that someone can read without Claude Code. Scope: `$ARGUMENTS`
(a service name, a layer, or empty for the whole portal).

## Gather

1. `search_portal_content` — `options: { num: 100, sortField: "title", sortOrder: "asc" }`. Capture
   title, item type, access level and item id for every item.
2. For each Feature Service / Map Service: the `layers` array — id, name, type.
3. For each layer in scope: `describe_layer` for the field list, spatial reference and extent.
4. For each layer in scope: `query_data` with `where 1=1` and `count` on the OID field. Where a field
   classifies the records, add a `groupByField` breakdown — see the layer-query skill.

## Write

One Markdown file. Sections in this order:

1. **Header** — portal host, date, and the exposure tag that scopes visibility
   (`${user_config.item_tag}` for this installation).
2. **Visible items** — table of title, type, access, item id. State explicitly that only tagged items
   are listed, so a later reader does not mistake the list for the whole portal.
3. **Layers per service** — table of layer id, name, geometry, one-line content. Keep the real ids,
   including gaps.
4. **Counts** — totals plus any breakdown, with the exact WHERE clause used.
5. **Field reference** — column name, alias, Esri type, meaning. Include the identifier conventions
   the data actually uses (asset prefixes, code lists, units), since those are what make the export
   usable by someone else.
6. **Queries used** — the tool calls with their arguments, so the numbers are reproducible.
7. **Footer** — service URLs, extent with its spatial reference, portal modification date, owner.

## Conventions

- Write to `<portal-or-service-name>-inventory.md` in the working directory unless the user names a path.
- Real values only. Never fill a field description with a guess — omit it, or mark it unknown.
- Thousands separators in prose, raw integers in tables.
- If the report is meant to be shared or read by a team, offer to publish it as an Artifact afterwards.
