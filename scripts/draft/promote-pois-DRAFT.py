import csv, json, sys

SRC = "/sessions/dazzling-nice-planck/mnt/NYC Explorer/data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv"
OUT = "/tmp/nycx-promote/poi.historical-draft.v1.json"

RUNTIME_FIELDS = ["id","name","summary","description","coords","neighborhood","tags","year","sources","images","borough","area","block","route_id","order"]

rows = []
errors = []

with open(SRC, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, start=2):  # line 2 = first data row
        try:
            tags = json.loads(row["tags"]) if row["tags"] else []
            sources = json.loads(row["sources"]) if row["sources"] else []
            images_raw = json.loads(row["images"]) if row["images"] else []
            images = [{"src": im["url"], "credit": im.get("credit",""), "license": im.get("license","")} for im in images_raw]

            poi = {
                "id": row["id"],
                "name": row["name"],
                "summary": row["summary"],
                "description": row["description"],
                "coords": {"lat": float(row["lat"]), "lng": float(row["lng"])},
                "neighborhood": row["neighborhood"],
                "tags": tags,
                "year": int(row["year"]),
                "sources": sources,
                "images": images,
                "borough": row["borough"],
                "area": row["area"],
                "block": row["block"],
                "route_id": row["route_id"],
                "order": int(row["order"]),
            }

            # --- lightweight validation gates (mirrors R-038 §6 proposed gates) ---
            row_errors = []
            for src in sources:
                url = src.get("url","")
                if "example.org" in url or not url:
                    row_errors.append(f"placeholder/missing source url: {url}")
            if not images:
                row_errors.append("no images (image-pending)")
            if not isinstance(poi["coords"]["lat"], float) or not isinstance(poi["coords"]["lng"], float):
                row_errors.append("coords not numeric")
            if not tags:
                row_errors.append("no tags")
            if poi["year"] not in (1852,1877,1902,1927,1952,1977,2002):
                row_errors.append(f"year not a canonical era: {poi['year']}")

            if row_errors:
                errors.append({"line": i, "id": row["id"], "issues": row_errors})

            rows.append(poi)
        except Exception as e:
            errors.append({"line": i, "id": row.get("id","?"), "issues": [f"EXCEPTION: {e}"]})

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(rows, f, indent=2, ensure_ascii=False)

print(f"Promoted {len(rows)} rows -> {OUT}")
print(f"Rows with validation flags: {len(errors)}")
for e in errors:
    print(f"  line {e['line']} [{e['id']}]: {'; '.join(e['issues'])}")

# schema field check
missing_field_rows = [r for r in rows if set(RUNTIME_FIELDS) - set(r.keys())]
print(f"Rows missing required fields: {len(missing_field_rows)}")

years = sorted(set(r["year"] for r in rows))
print(f"Eras covered: {years}")
print(f"Unique route_ids: {sorted(set(r['route_id'] for r in rows))}")
