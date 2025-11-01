/* nycx_migrations.sql — add cd_id and tile_id for Lower Manhattan expansion */
ALTER TABLE nycx.attractions ADD cd_id NVARCHAR(10) NULL, tile_id NVARCHAR(20) NULL;
ALTER TABLE nycx.events      ADD cd_id NVARCHAR(10) NULL, tile_id NVARCHAR(20) NULL;

CREATE INDEX IX_attractions_cd ON nycx.attractions(cd_id);
CREATE INDEX IX_attractions_tile ON nycx.attractions(tile_id);
CREATE INDEX IX_events_cd ON nycx.events(cd_id);
CREATE INDEX IX_events_tile ON nycx.events(tile_id);
GO

/* Optional helper: tiles table scaffold */
IF OBJECT_ID('nycx.tiles','U') IS NULL
BEGIN
    CREATE TABLE nycx.tiles (
        tile_id NVARCHAR(20) NOT NULL PRIMARY KEY,
        cd_id   NVARCHAR(10) NOT NULL,
        label   NVARCHAR(100) NULL,
        notes   NVARCHAR(400) NULL
    );
END
GO

/* Seed Community Districts table (if desired) */
IF OBJECT_ID('nycx.community_districts','U') IS NULL
BEGIN
    CREATE TABLE nycx.community_districts (
        cd_id  NVARCHAR(10) NOT NULL PRIMARY KEY,
        name   NVARCHAR(200) NOT NULL,
        aka    NVARCHAR(200) NULL,
        notes  NVARCHAR(400) NULL
    );
END
GO

MERGE nycx.community_districts AS target
USING (VALUES
('MN01','Manhattan Community District 1','Lower Manhattan / Financial District','Includes Battery Park City, Financial District, Tribeca, South Street Seaport, Civic Center.'),
('MN02','Manhattan Community District 2','Greenwich Village & Soho','Includes West Village, Greenwich Village, NoHo, SoHo, Hudson Square, South Village, Meatpacking.'),
('MN03','Manhattan Community District 3','Lower East Side & East Village','Includes East Village, Alphabet City, Bowery, Lower East Side, Chinatown, Two Bridges, Little Italy, Nolita.')
) AS src(cd_id,name,aka,notes)
ON (target.cd_id = src.cd_id)
WHEN NOT MATCHED THEN
  INSERT (cd_id,name,aka,notes) VALUES (src.cd_id,src.name,src.aka,src.notes);
GO
