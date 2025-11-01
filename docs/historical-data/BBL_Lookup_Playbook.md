# BBL Lookup Playbook (Manhattan focus)

Goal: Fill `bbl` in `nycx.attractions` and `nycx.events` with **10-digit BBL** (e.g., 1008200001).

## Sources (manual lookup)
1. **ZoLa (NYC Planning):** https://zola.planning.nyc.gov — search by address or click lot; copy the 10-digit BBL.
2. **NYC Dept. of Finance Property Tax Map:** https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address
3. **NYC OpenData PLUTO (MapPLUTO):** Download Manhattan PLUTO; filter by `Address` or `BIN` and copy `BBL`.
4. **OASIS NYC:** http://oasisnyc.net/ — interactive map with tax lots and BBL.
5. **ACRIS:** https://a836-acris.nyc.gov/CP/ — search deeds by address; BBL appears in property details.

## Workflow
- Use `address_hint` + `name` to search. Confirm by cross-checking **lat/lng** and frontage.
- Prefer **parks' BBLs** for statues and memorials within park boundaries.
- Record the source used (ZoLa / DOF / PLUTO) and date in `nycx.bbl_registry`.

## Normalization
- Store the canonical 10-digit string in `bbl` (e.g., '1008200001').
- If you have 'borough-block-lot' hyphenated strings, convert via:
  - borough code (Manhattan=1) + block (left-pad 5) + lot (left-pad 4).

## Example UPDATEs
```sql
-- Flatiron Building (175 Fifth Ave) — TODO: verify in ZoLa, then update:
UPDATE nycx.attractions SET bbl = '??????????' WHERE id = 'flatiron-building-2002';

-- Tammany Hall / 44 Union Square East — TODO:
UPDATE nycx.attractions SET bbl = '??????????' WHERE id = 'tammany-hall-building-1977';

-- Daryl Roth Theatre (20 Union Sq E) — TODO:
UPDATE nycx.attractions SET bbl = '??????????' WHERE id = 'daryl-roth-theatre-2002';
```
