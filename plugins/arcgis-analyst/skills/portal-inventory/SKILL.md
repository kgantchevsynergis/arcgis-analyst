---
name: portal-inventory
description: Lists which ArcGIS Portal items, services and layers Claude is actually allowed to read, with layer IDs and geometry types. Use when the user asks what GIS data is available, which layers can be read, what is in the portal, or when you need to find a service before querying it.
---

# Portal inventory

Answer "what can you read?" with the real, permission-scoped list — never with a guess.

## What the MCP server can see

The ArcGIS MCP server only returns Portal items carrying the **exposure tag**, `mcp` in a default
deployment. The tag filter is injected automatically into every search. Consequences you must
communicate:

- An empty or short result means **nothing carries that tag**, not that the portal is empty. Say so explicitly.
- Never put `tags:"mcp"` into a `passthrough` query yourself — it is added for you and doubles up.
- A deployment may scope on a different tag. Read the real one off the `tags` array of any item that
  comes back; if nothing comes back at all, ask which tag is in use rather than assuming the portal
  is empty.
- Results are further limited by the authenticated account's own permissions.

## Procedure

1. **Search.** `search_portal_content` with no filter and `options: { num: 100, sortField: "title", sortOrder: "asc" }`.
   When 10 or fewer items come back, feature and map service items already include their full
   service definition — so a single call usually answers the whole question.

2. **Read the `layers` array** on each Feature Service / Map Service item. Each entry has `id`, `name`
   and `type`. Report the layer `id` values verbatim: they are the addresses you need later, and they
   are frequently **non-contiguous** (a service can expose 1, 4, 5, 6 with 2 and 3 unused). Never
   renumber them and never assume `0` exists.

3. **Note the item types that carry no layers**, and say why rather than omitting them:
   - `Service Definition` — the upload artifact behind a service, no queryable layers.
   - `OGCFeatureServer` — an OGC API endpoint; the item exposes no layer list, so `query_data` has
     nothing to address. Mention it as present but not queryable this way.
   - `Geoprocessing Service` — use `get_gp_task_definition`, not `query_data`.

4. **Fill gaps only if needed.** For a service whose layer list is missing, call `describe_item` with
   the item id. For field-level detail on one layer, use `describe_layer` (service URL + layer id).

## Searching for something specific

Use `structuredFilter` for simple AND-ed filters. Two traps:

- `Feature Layer` and `Table` are **not** valid item types. To find layer-bearing services, put
  `(type:"feature service" OR type:"map service")` in the `q` string instead of using `type`.
- Boolean logic beyond AND, nesting, or exclusion requires the `passthrough` q string. Call
  `get_search_portal_content_passthrough_instructions` first if you need that syntax.

## Reporting

Give a table per service: layer ID, name, geometry, one line on content. Then state the scope
plainly — which tag gates visibility, and which items are visible but not queryable. If the user
named a dataset they expected and it is absent, say it is not tagged rather than that it does not exist.
