/* nycx_manhattan_seed.sql — seed community districts (MN01–MN12) and optional neighborhoods */
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'nycx')
    EXEC('CREATE SCHEMA nycx');
GO

IF OBJECT_ID('nycx.community_districts','U') IS NULL
BEGIN
    CREATE TABLE nycx.community_districts (
        cd_id NVARCHAR(10) NOT NULL PRIMARY KEY,
        description NVARCHAR(300) NOT NULL
    );
END
GO

MERGE nycx.community_districts AS t
USING (VALUES
('MN01','Lower Manhattan / FiDi / Tribeca / Seaport / Civic Center'),
('MN02','Greenwich Village / SoHo / NoHo / Hudson Sq / Meatpacking'),
('MN03','East Village / LES / Chinatown / Bowery / Two Bridges / Nolita'),
('MN04','Chelsea / Hudson Yards / Hell’s Kitchen (south)'),
('MN05','Midtown / Times Sq / Garment District / Bryant Park / Rockefeller Ctr'),
('MN06','Gramercy / Kips Bay / Murray Hill / Stuy Town–PCV / Turtle Bay / UN'),
('MN07','Upper West Side / Lincoln Sq / Manhattan Valley'),
('MN08','Upper East Side / Lenox Hill / Yorkville / Carnegie Hill'),
('MN09','Morningside Hts / Manhattanville / Hamilton Hts'),
('MN10','Central Harlem'),
('MN11','East Harlem / El Barrio'),
('MN12','Washington Heights / Inwood')
) AS src(cd_id, description)
ON (t.cd_id = src.cd_id)
WHEN NOT MATCHED THEN INSERT (cd_id, description) VALUES (src.cd_id, src.description)
WHEN MATCHED THEN UPDATE SET description = src.description;
GO

IF OBJECT_ID('nycx.neighborhoods','U') IS NULL
BEGIN
    CREATE TABLE nycx.neighborhoods (
        cd_id NVARCHAR(10) NOT NULL,
        neighborhood NVARCHAR(120) NOT NULL,
        PRIMARY KEY(cd_id, neighborhood)
    );
END
GO

/* Seed neighborhoods */
MERGE nycx.neighborhoods AS t
USING (VALUES
-- MN01
('MN01','Financial District'),('MN01','Tribeca'),('MN01','Battery Park City'),('MN01','Civic Center'),('MN01','South Street Seaport'),
-- MN02
('MN02','West Village'),('MN02','Greenwich Village'),('MN02','SoHo'),('MN02','NoHo'),('MN02','Hudson Square'),('MN02','South Village'),('MN02','Meatpacking'),
-- MN03
('MN03','East Village'),('MN03','Alphabet City'),('MN03','Lower East Side'),('MN03','Chinatown'),('MN03','Two Bridges'),('MN03','Bowery'),('MN03','Nolita'),('MN03','Little Italy'),
-- MN04
('MN04','Chelsea'),('MN04','Hudson Yards'),('MN04','Hell''s Kitchen South'),('MN04','West Chelsea'),
-- MN05
('MN05','Midtown'),('MN05','Times Square'),('MN05','Garment District'),('MN05','Bryant Park'),('MN05','Rockefeller Center'),('MN05','Koreatown'),
-- MN06
('MN06','Gramercy'),('MN06','Kips Bay'),('MN06','Murray Hill'),('MN06','Turtle Bay'),('MN06','Stuyvesant Town–PCV'),('MN06','UN/Tudor City'),
-- MN07
('MN07','Upper West Side'),('MN07','Lincoln Square'),('MN07','Manhattan Valley'),
-- MN08
('MN08','Upper East Side'),('MN08','Carnegie Hill'),('MN08','Lenox Hill'),('MN08','Yorkville'),
-- MN09
('MN09','Morningside Heights'),('MN09','Manhattanville'),('MN09','Hamilton Heights'),
-- MN10
('MN10','Central Harlem West'),('MN10','Central Harlem East'),
-- MN11
('MN11','East Harlem South'),('MN11','East Harlem North'),('MN11','Randall''s Island (adjacent)'),
-- MN12
('MN12','Washington Heights South'),('MN12','Washington Heights North'),('MN12','Inwood')
) AS src(cd_id, neighborhood)
ON (t.cd_id = src.cd_id AND t.neighborhood = src.neighborhood)
WHEN NOT MATCHED THEN INSERT (cd_id, neighborhood) VALUES (src.cd_id, src.neighborhood);
GO
