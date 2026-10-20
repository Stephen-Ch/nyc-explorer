-- Smoke test for 0002. Run only on a throwaway Neon branch (try-0002) right after 0002, never on production.
-- Ends with 'ALL PASS' only if every check passed. Leaves nothing behind (ROLLBACK).
BEGIN;
DO $$BEGIN
  PERFORM 1 FROM core.schema_migrations WHERE version='0002';
  IF NOT FOUND THEN RAISE EXCEPTION '0002 row missing'; END IF;
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('core','research') AND table_type='BASE TABLE') <> 23
    THEN RAISE EXCEPTION 'expected 23 tables'; END IF;
  RAISE NOTICE 'PASS objects';
END$$;
INSERT INTO core.city VALUES ('chi','Chicago',3435,'America/Chicago','chi-pin');
INSERT INTO research.packet (city_id,candidate_id,unit_id,run_id,drive_file_id,packet)
  VALUES ('nyc','mn01-1877-smoke','MN01-1877','run-1','f1','{}'), ('nyc','mn01-1902-smoke','MN01-1902','run-2','f2','{}');
INSERT INTO core.place (place_id,city_id,canonical_name) VALUES ('nyc-smoke-a','nyc','A'), ('chi-smoke-b','chi','B');
INSERT INTO core.place_version (place_id,name_in_period,kind,first_year,last_year) VALUES ('nyc-smoke-a','A','building',1877,1902);
INSERT INTO core.place_version (place_id,name_in_period,kind,first_year) VALUES ('chi-smoke-b','B','building',1890);
DO $$DECLARE pv bigint; c0 timestamptz; BEGIN
  SELECT place_version_id, created_utc INTO pv, c0 FROM core.place_version WHERE place_id='nyc-smoke-a';
  -- two packets (1877, 1902) support one place version; a repeat promotion is refused
  INSERT INTO research.promotion (packet_row_id, place_version_id) SELECT packet_row_id, pv FROM research.packet;
  BEGIN INSERT INTO research.promotion (packet_row_id, place_version_id) SELECT packet_row_id, pv FROM research.packet LIMIT 1;
    RAISE EXCEPTION 'repeat promotion allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  -- a packet that produced something can't be deleted
  BEGIN DELETE FROM research.packet WHERE candidate_id='mn01-1877-smoke'; RAISE EXCEPTION 'packet delete allowed!';
  EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL; END;
  -- promoted needs a time; promoted can later become superseded
  BEGIN UPDATE research.packet SET review_state='promoted' WHERE candidate_id='mn01-1877-smoke'; RAISE EXCEPTION 'promoted without time!';
  EXCEPTION WHEN check_violation THEN NULL; END;
  UPDATE research.packet SET review_state='promoted', promoted_utc=now() WHERE candidate_id='mn01-1877-smoke';
  -- a resumed run's copy of a live candidate is refused while the first is live
  BEGIN INSERT INTO research.packet (city_id,candidate_id,unit_id,run_id,drive_file_id,packet) VALUES ('nyc','mn01-1877-smoke','MN01-1877','run-3','f3','{}');
    RAISE EXCEPTION 'second live copy allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  UPDATE research.packet SET review_state='superseded' WHERE candidate_id='mn01-1877-smoke';
  -- created_utc can't be rewritten; a version can't move to another place
  UPDATE core.place_version SET summary='x', created_utc='2099-01-01' WHERE place_version_id=pv;
  IF (SELECT created_utc FROM core.place_version WHERE place_version_id=pv) <> c0 THEN RAISE EXCEPTION 'created_utc changed!'; END IF;
  BEGIN UPDATE core.place_version SET place_id='chi-smoke-b', first_year=1700, last_year=1700 WHERE place_version_id=pv;
    RAISE EXCEPTION 'reparent allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  RAISE NOTICE 'PASS packets and promotion';
  -- lot refs: good BBL ok, bad BBL refused, wrong city refused, missing check time allowed
  INSERT INTO core.place_version_lot_ref (place_version_id,city_id,native_id,method,checked_utc) VALUES (pv,'nyc','1000490001','pluto-exact-address',now());
  INSERT INTO core.place_version_lot_ref (place_version_id,city_id,native_id,method) VALUES (pv,'nyc','1000490001','pluto-bbl-check');
  BEGIN INSERT INTO core.place_version_lot_ref (place_version_id,city_id,native_id,method) VALUES (pv,'nyc','123','other');
    RAISE EXCEPTION 'bad BBL allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO core.place_version_lot_ref (place_version_id,city_id,native_id,method) VALUES (pv,'chi','17-09-123','other');
    RAISE EXCEPTION 'cross-city lot ref allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  RAISE NOTICE 'PASS lot refs';
END$$;
-- sources, quotes, claims and atlases can't be duplicated
INSERT INTO core.source (city_id,title,publisher,url,tier) VALUES (NULL,'LoC page','Library of Congress','https://www.loc.gov/item/smoke/','primary');
INSERT INTO core.source (city_id,title,publisher,catalog_no,tier) VALUES ('nyc','Print','Metropolitan Museum of Art','380745','primary');
INSERT INTO core.atlas (city_id,name,edition_year) VALUES ('nyc','Perris',1852);
INSERT INTO core.atlas (city_id,name,edition_year) VALUES ('nyc','Bromley',1879);
INSERT INTO core.atlas_plate (atlas_id,plate_label) SELECT atlas_id,'Plate 1' FROM core.atlas WHERE name='Perris';
DO $$DECLARE s bigint; q bigint; pv bigint; BEGIN
  BEGIN INSERT INTO core.source (city_id,title,publisher,url,tier) VALUES ('nyc','dup','LoC','http://loc.gov/item/smoke','primary');
    RAISE EXCEPTION 'duplicate url allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN INSERT INTO core.source (city_id,title,publisher,catalog_no,tier) VALUES ('nyc','dup','metropolitan museum of art','380745','primary');
    RAISE EXCEPTION 'duplicate catalog allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  SELECT source_id INTO s FROM core.source WHERE catalog_no='380745';
  INSERT INTO core.quote (source_id,fragment,accessed_utc,check_status) VALUES (s,'a fragment of text',now(),'unverified') RETURNING quote_id INTO q;
  BEGIN INSERT INTO core.quote (source_id,fragment,accessed_utc,check_status) VALUES (s,'a fragment of text',now(),'unverified');
    RAISE EXCEPTION 'duplicate quote allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  SELECT place_version_id INTO pv FROM core.place_version WHERE place_id='nyc-smoke-a';
  INSERT INTO core.claim (place_version_id,fact,quote_id) VALUES (pv,'name',q);
  BEGIN INSERT INTO core.claim (place_version_id,fact,quote_id) VALUES (pv,'name',q);
    RAISE EXCEPTION 'duplicate claim allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN INSERT INTO core.atlas (city_id,name,edition_year) VALUES ('nyc','Perris',1852);
    RAISE EXCEPTION 'duplicate atlas allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN INSERT INTO core.place_version_atlas_ref (place_version_id,atlas_id,plate_id)
    SELECT pv, (SELECT atlas_id FROM core.atlas WHERE name='Bromley'), plate_id FROM core.atlas_plate LIMIT 1;
    RAISE EXCEPTION 'plate from another atlas allowed!'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  RAISE NOTICE 'PASS no duplicates';
END$$;
-- footprints and parcels stay in one city; parcel ids match their parts; event end precision
INSERT INTO core.parcel VALUES ('nyc:bbl:1000490001:smoke','nyc','1000490001','smoke',
  ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(-74.0122,40.7081),4326)::geography,40)::geometry));
INSERT INTO core.footprint (place_version_id,geom,method,confidence)
  SELECT place_version_id, ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(-74.0122,40.7081),4326)::geography,20)::geometry),'other',50
  FROM core.place_version WHERE place_id='chi-smoke-b';
DO $$BEGIN
  BEGIN INSERT INTO core.footprint_parcel SELECT footprint_id,'nyc:bbl:1000490001:smoke',100,25,now() FROM core.footprint;
    RAISE EXCEPTION 'cross-city overlap allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE core.footprint SET place_version_id=(SELECT place_version_id FROM core.place_version WHERE place_id='nyc-smoke-a');
    RAISE EXCEPTION 'footprint reparent allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO core.parcel VALUES ('nyc:bbl:%:smoke2','nyc','1000490002','smoke2', ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(-74,40.7),4326)::geography,10)::geometry));
    RAISE EXCEPTION 'mismatched parcel id allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO core.event (place_id,title,date_start,date_precision,date_end,date_end_precision) VALUES ('nyc-smoke-a','e','1877-01-01','year','1878-05-17','year');
    RAISE EXCEPTION 'mid-year end date with year precision allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  RAISE NOTICE 'PASS city links and dates';
END$$;
-- round 2: one packet makes one version; merges inside a city; promotion rows block deletes; path case kept
INSERT INTO core.place (place_id,city_id,canonical_name) VALUES ('nyc-smoke-c','nyc','C');
DO $$DECLARE pv bigint; pv2 bigint; BEGIN
  SELECT place_version_id INTO pv FROM core.place_version WHERE place_id='nyc-smoke-a';
  INSERT INTO core.place_version (place_id,name_in_period,kind,first_year) VALUES ('nyc-smoke-c','C','building',1950) RETURNING place_version_id INTO pv2;
  BEGIN INSERT INTO research.promotion (packet_row_id, place_version_id) SELECT packet_row_id, pv2 FROM research.packet WHERE candidate_id='mn01-1902-smoke';
    RAISE EXCEPTION 'one packet made two versions!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  UPDATE core.place_version SET place_id='nyc-smoke-c' WHERE place_version_id=pv;   -- same-city merge is allowed
  BEGIN DELETE FROM core.place_version WHERE place_version_id=pv; RAISE EXCEPTION 'version with promotions deleted!';
  EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL; END;
  INSERT INTO core.source (title,publisher,url,tier) VALUES ('Dir','Internet Archive','https://archive.org/details/NYCityDirectory1877','primary');
  INSERT INTO core.source (title,publisher,url,tier) VALUES ('Dir2','Internet Archive','https://archive.org/details/nycitydirectory1877','primary');
  BEGIN INSERT INTO core.source (title,publisher,url,tier) VALUES ('Dir3','IA','https://Archive.org:443/details/NYCityDirectory1877/#p3','primary');
    RAISE EXCEPTION 'host/port/fragment variant allowed!'; EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN INSERT INTO core.parcel VALUES ('nyc:bbl:1000490003:r1:','nyc','1000490003','r1:', ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(-74,40.7),4326)::geography,10)::geometry));
    RAISE EXCEPTION 'extra colon parcel id allowed!'; EXCEPTION WHEN check_violation THEN NULL; END;
  RAISE NOTICE 'PASS round 2 fixes';
END$$;
SELECT 'ALL PASS' AS result;
ROLLBACK;
