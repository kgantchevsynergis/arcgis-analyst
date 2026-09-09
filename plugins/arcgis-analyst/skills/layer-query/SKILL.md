---
name: layer-query
description: Queries an ArcGIS feature layer or table for records, counts and grouped statistics using the required describe-then-query workflow. Use whenever the user asks how many, which, or where about GIS features, or wants an attribute filter, aggregation or breakdown.
---

# Layer queries

## The one hard rule

**`describe_layer` before `query_data`. Every time.** A `query_data` call on a layer you have not
described in this conversation is a failed run — field names invented from a layer title are the
single largest source of empty result sets and SQL errors.

```
describe_layer
  serviceUrl = https://host/arcgis/rest/services/Hosted/<Service>/FeatureServer   # the SERVICE
  layerId    = 1                                                                  # the layer id
```

Note the asymmetry, it is easy to get wrong:

| Tool | URL to pass |
| --- | --- |
| `describe_layer` | the **service** URL, plus `layerId` as a separate argument |
| `query_data` | the **layer** URL — service URL with `/<layerId>` appended |

`describe_layer` returns every field with its Esri type, alias, sample values and often a
`fieldValueType` classifier, plus the layer extent and spatial reference. Build the WHERE clause from
those names only, in SQL-92.

## Counting

```
query_data
  layerOrTableUrl = .../FeatureServer/1
  where           = 1=1
  statistics      = [{ statisticType: "count", onField: "<oid field>" }]
```

Take the OID field name from `describe_layer` — it is often not `objectid`. A layer can carry both an
`objectid` column and a separate `esriFieldTypeOID` field; count on the OID one.

## The counting trap: a layer name is not its content

Before quoting a total as the answer to a "how many X" question, group by the field that classifies
the records and check whether the layer holds only X:

```
query_data
  layerOrTableUrl = .../FeatureServer/1
  where           = 1=1
  groupByField    = <classifying field>
  statistics      = [{ statisticType: "count", onField: "<oid field>" }]
```

A layer named `Trinkbrunnen` legitimately held 2,382 records across 16 values of `typ_text` — drinking
fountains, drinking hydrants, ornamental fountains, mist showers. The honest answer gives the total,
the breakdown, and a figure for each plausible reading of the question. Do not silently pick one.

## Records

- Default: all attributes, **no geometry**, first 100 matches. Ask for `returnGeometry` only when the
  geometry is actually needed — it is bulky.
- `pageSize` up to 1000, `resultOffset` to page. When no statistics are requested the tool also
  returns the total match count: compare it against what you received and **say when the result set is
  truncated**.
- Large extractions belong in a geoprocessing task, not in dozens of pages.

## Spatial filters

Pass `geometry` as an Esri JSON string with `spatialReference` **inside** it, together with
`geometryType`. Derive the geometry from a previous tool result (a layer extent, a geocode hit), not
by hand. `bufferDistance` requires `bufferUnits`. A projected layer (for example `wkid 102100`,
Web Mercator) needs coordinates in that reference, even when the layer also carries plain `lat` /
`lon` attribute columns.

## Reporting numbers

Use the field alias, not the raw column name, when writing for people. Give counts as exact integers,
state the WHERE clause used, and name the layer and service read. Where a figure depends on an
interpretation, show the interpretations side by side.
