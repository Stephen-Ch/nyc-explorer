import csv, json, math

PLACES_JSON = "/tmp/nycx-promote/poi.historical-draft.v1.json"
EVENTS_CSV = "/sessions/dazzling-nice-planck/mnt/NYC Explorer/data/historical/Events_withBBL_andTiles.csv"
OUT = "/tmp/nycx-promote/poi.historical-draft-with-events.v1.json"

THRESHOLD_M = 150  # walking-distance join threshold, per R-040's block-size guidance

def haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

places = json.load(open(PLACES_JSON, encoding="utf-8"))

# group by place_id (strip trailing -YYYY)
def place_id_of(poi_id, year):
    suffix = f"-{year}"
    return poi_id[:-len(suffix)] if poi_id.endswith(suffix) else poi_id

place_families = {}  # place_id -> {coords, rows: [poi,...]}
for p in places:
    pid = place_id_of(p["id"], p["year"])
    fam = place_families.setdefault(pid, {"coords": p["coords"], "rows": []})
    fam["rows"].append(p)

events = list(csv.DictReader(open(EVENTS_CSV, encoding="utf-8")))

matches = []       # (event, place_id, distance)
unmatched = []      # events with no place within threshold

for ev in events:
    elat, elng = float(ev["lat"]), float(ev["lng"])
    best_pid, best_d = None, None
    for pid, fam in place_families.items():
        d = haversine_m(elat, elng, fam["coords"]["lat"], fam["coords"]["lng"])
        if best_d is None or d < best_d:
            best_pid, best_d = pid, d
    if best_d is not None and best_d <= THRESHOLD_M:
        matches.append((ev, best_pid, best_d))
    else:
        unmatched.append((ev, best_pid, best_d))

# build events[] per place_id
events_by_place = {}
for ev, pid, d in matches:
    sources = json.loads(ev["sources"]) if ev.get("sources") else []
    entry = {
        "id": ev["id"],
        "title": ev["title"],
        "date": ev["start_date"],
        "end_date": ev.get("end_date") or None,
        "summary": ev["summary"],
        "sources": sources,
    }
    events_by_place.setdefault(pid, []).append(entry)

for pid, evs in events_by_place.items():
    evs.sort(key=lambda e: e["date"])

# attach to every era-row of the matching place family
attached_count = 0
for p in places:
    pid = place_id_of(p["id"], p["year"])
    if pid in events_by_place:
        p["events"] = events_by_place[pid]
        attached_count += 1
    else:
        p["events"] = []

json.dump(places, open(OUT, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

print(f"Place families: {len(place_families)}")
print(f"Events read: {len(events)}")
print(f"Events matched (<= {THRESHOLD_M}m): {len(matches)}")
print(f"Events unmatched: {len(unmatched)}")
print(f"Era-rows carrying >=1 event: {attached_count} / {len(places)}")
print()
print("--- Matches ---")
for ev, pid, d in sorted(matches, key=lambda x: x[2]):
    print(f"  {ev['title'][:45]:45} -> {pid:30} ({d:.0f}m)")
print()
print("--- Unmatched (nearest place shown, over threshold) ---")
for ev, pid, d in unmatched:
    print(f"  {ev['title'][:45]:45} -> nearest {pid} ({d:.0f}m, over {THRESHOLD_M}m)")
print()
print(f"Output written: {OUT}")
