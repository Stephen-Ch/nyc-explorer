/* nycx_schema.sql — NYC Explorer (Union Square–Flatiron) — SQL Server DDL
   Notes:
   - Store JSON arrays as NVARCHAR(MAX) for tags/sources/images/people/categories; parse app-side.
   - BBL is NVARCHAR(15) to support both '1008200001' and '1-820-1' styles until normalized.
*/
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'nycx')
    EXEC('CREATE SCHEMA nycx');
GO

-- Core: Attractions ("what was here?")
IF OBJECT_ID('nycx.attractions','U') IS NOT NULL DROP TABLE nycx.attractions;
CREATE TABLE nycx.attractions (
    id            NVARCHAR(100) NOT NULL PRIMARY KEY,
    name          NVARCHAR(300) NOT NULL,
    summary       NVARCHAR(1000) NULL,
    description   NVARCHAR(MAX) NULL,
    lat           DECIMAL(9,6)  NOT NULL,
    lng           DECIMAL(9,6)  NOT NULL,
    borough       NVARCHAR(50)  NULL,
    neighborhood  NVARCHAR(100) NULL,
    area          NVARCHAR(100) NULL,
    block_label   NVARCHAR(200) NULL, -- human-readable "block" field from research
    address_hint  NVARCHAR(300) NULL, -- assists BBL lookup
    bbl           NVARCHAR(15)  NULL, -- Borough-Block-Lot (normalized later to 10-digit numeric if desired)
    year          INT           NOT NULL,
    route_id      NVARCHAR(100) NULL,
    display_order INT           NULL,
    tags_json     NVARCHAR(MAX) NULL,
    sources_json  NVARCHAR(MAX) NULL,
    images_json   NVARCHAR(MAX) NULL,
    year_file     NVARCHAR(8)   NULL
);
GO
CREATE INDEX IX_attractions_geo ON nycx.attractions(lat, lng);
CREATE INDEX IX_attractions_year ON nycx.attractions(year);
CREATE INDEX IX_attractions_bbl ON nycx.attractions(bbl);
GO

-- Core: Events ("what happened here?")
IF OBJECT_ID('nycx.events','U') IS NOT NULL DROP TABLE nycx.events;
CREATE TABLE nycx.events (
    id            NVARCHAR(120) NOT NULL PRIMARY KEY,
    title         NVARCHAR(400) NOT NULL,
    start_date    DATE          NOT NULL,
    end_date      DATE          NULL,
    is_approximate BIT          NOT NULL DEFAULT(0),
    borough       NVARCHAR(50)  NULL,
    neighborhood  NVARCHAR(100) NULL,
    area          NVARCHAR(100) NULL,
    lat           DECIMAL(9,6)  NOT NULL,
    lng           DECIMAL(9,6)  NOT NULL,
    bbl           NVARCHAR(15)  NULL,
    categories_json NVARCHAR(MAX) NULL,
    people_json     NVARCHAR(MAX) NULL,
    summary       NVARCHAR(1000) NULL,
    description   NVARCHAR(MAX) NULL,
    sources_json  NVARCHAR(MAX) NULL,
    images_json   NVARCHAR(MAX) NULL
);
GO
CREATE INDEX IX_events_geo ON nycx.events(lat, lng);
CREATE INDEX IX_events_dates ON nycx.events(start_date, end_date);
CREATE INDEX IX_events_bbl ON nycx.events(bbl);
GO

-- (Optional) Lookup for BBL normalization
IF OBJECT_ID('nycx.bbl_registry','U') IS NOT NULL DROP TABLE nycx.bbl_registry;
CREATE TABLE nycx.bbl_registry (
    bbl10      CHAR(10)      NOT NULL PRIMARY KEY, -- '1' + 5-digit block + 4-digit lot (Manhattan=1)
    borough    TINYINT       NOT NULL,             -- 1=Manhattan, 2=Bronx, 3=Brooklyn, 4=Queens, 5=Staten Island
    block      INT           NOT NULL,
    lot        INT           NOT NULL,
    address    NVARCHAR(200) NULL,
    place_name NVARCHAR(200) NULL,
    source     NVARCHAR(200) NULL,
    last_seen  DATETIME2     NULL DEFAULT SYSUTCDATETIME()
);
GO
