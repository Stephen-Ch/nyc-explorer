-- Smoke test for 0001 (v3). Run only on a throwaway Neon branch (try-0001), never on production. Every check prints PASS or raises an error.
BEGIN;
-- 1. objects exist (named, not counted)
DO $$DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM information_schema.tables WHERE table_schema IN ('core','research') AND table_type='BASE TABLE';
  IF n <> 20 THEN RAISE EXCEPTION 'expected 20 tables, got %', n; END IF;
  PERFORM 1 FROM information_schema.views WHERE table_schema='core' AND table_name='v_place_in_year';
  IF NOT FOUND THEN RAISE EXCEPTION 'view missing'; END IF;
  PERFORM 1 FROM core.schema_migrations WHERE version='0001';
  IF NOT FOUND THEN RAISE EXCEPTION 'migration row missing'; END IF;
  PERFORM postgis_version();
  RAISE NOTICE 'PASS objects';
END$$;
-- 2. data: church still standing; hotel 1859-1908; shop seen only in 1877
INSERT INTO core.place (place_id, city_id, canonical_name) VALUES
 ('nyc-smoke-church','nyc','Smoke Church'), ('nyc-smoke-hotel','nyc','Smoke Hotel'), ('nyc-smoke-shop','nyc','Smoke Shop');
INSERT INTO core.place_version (place_id,name_in_period,kind,first_year,last_year,start_unknown,closed_unknown,status) VALUES
 ('nyc-smoke-church','Smoke Church','building',1846,NULL,false,false,'approved'),
 ('nyc-smoke-hotel','Smoke Hotel','building',1859,1908,false,false,'approved'),
 ('nyc-smoke-shop','Smoke Shop','building',1877,1877,true,true,'approved');
INSERT INTO core.place_point (place_version_id, geom, method)
 SELECT place_version_id, ST_SetSRID(ST_MakePoint(-74.0122,40.7081),4326), 'manual' FROM core.place_version WHERE place_id LIKE 'nyc-smoke-%';
-- 3. year view
DO $$BEGIN
  IF (SELECT count(*) FROM core.v_place_in_year WHERE place_id LIKE 'nyc-smoke-%' AND year=1852) <> 1 THEN RAISE EXCEPTION '1852 should show only the church'; END IF;
  IF (SELECT count(*) FROM core.v_place_in_year WHERE place_id LIKE 'nyc-smoke-%' AND year=1877) <> 3 THEN RAISE EXCEPTION '1877 should show 3'; END IF;
  IF (SELECT count(*) FROM core.v_place_in_year WHERE place_id LIKE 'nyc-smoke-%' AND year=1902) <> 2 THEN RAISE EXCEPTION '1902 should show 2'; END IF;
  IF (SELECT count(*) FROM core.v_place_in_year WHERE place_id LIKE 'nyc-smoke-%' AND year=1927) <> 1 THEN RAISE EXCEPTION '1927 should show 1'; END IF;
  RAISE NOTICE 'PASS year view';
END$$;
-- 4. overlap refused; adjacent allowed; rejected rows ignored
DO $$BEGIN
  BEGIN INSERT INTO core.place_version (place_id,name_in_period,kind,first_year,last_year) VALUES ('nyc-smoke-hotel','x','building',1908,1920);
    RAISE EXCEPTION 'overlap allowed!'; EXCEPTION WHEN exclusion_violation THEN NULL; END;
  INSERT INTO core.place_version (place_id,name_in_period,kind,first_year,last_year) VALUES ('nyc-smoke-hotel','Rebuilt','building',1909,1950);
  INSERT INTO core.place_version (place_id,name_in_period,kind,first_year,last_year,status) VALUES ('nyc-smoke-shop','bad','building',1860,1880,'rejected');
  INSERT INTO core.place_version (place_id,name_in_period,kind,first_year,last_year) VALUES ('nyc-smoke-shop','Earlier','building',1850,1860);
  RAISE NOTICE 'PASS overlap rules';
END$$;
-- 5. footprint over a parcel, overlap computed in feet
INSERT INTO core.parcel VALUES ('nyc:bbl:9999999999:smoke','nyc','9999999999','smoke',
 ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(-74.0122,40.7081),4326)::geography,40)::geometry));
INSERT INTO core.footprint (place_version_id,geom,method,confidence)
 SELECT place_version_id, ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(-74.0124,40.7081),4326)::geography,25)::geometry),'other',50
 FROM core.place_version WHERE place_id='nyc-smoke-church';
INSERT INTO core.footprint_parcel (footprint_id,parcel_id,overlap_pct_of_footprint,overlap_pct_of_parcel)
SELECT f.footprint_id, p.parcel_id,
 round((100*ST_Area(ST_Intersection(ST_Transform(f.geom,2263),ST_Transform(p.geom,2263)))/ST_Area(ST_Transform(f.geom,2263)))::numeric,2),
 round((100*ST_Area(ST_Intersection(ST_Transform(f.geom,2263),ST_Transform(p.geom,2263)))/ST_Area(ST_Transform(p.geom,2263)))::numeric,2)
FROM core.footprint f JOIN core.parcel p ON ST_Intersects(f.geom,p.geom) WHERE p.parcel_id='nyc:bbl:9999999999:smoke';
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.footprint_parcel WHERE parcel_id='nyc:bbl:9999999999:smoke' AND overlap_pct_of_footprint > 90) THEN RAISE EXCEPTION 'overlap calc wrong'; END IF;
  RAISE NOTICE 'PASS overlap calc';
END$$;
-- 6. delete of a place in use is refused
DO $$BEGIN
  BEGIN DELETE FROM core.place WHERE place_id='nyc-smoke-church'; RAISE EXCEPTION 'delete allowed!';
  EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL; END;
  RAISE NOTICE 'PASS delete rules';
END$$;
SELECT 'ALL PASS' AS result;  -- only reached if every check above passed
ROLLBACK;
