-- nycx_seed_landmarks_bbl.sql

-- Stonewall Inn (51–53 Christopher St) Greenwich Village block 610 lot 1
UPDATE attractions
SET bbl = '1006100001', block = 610, lot = 1
WHERE slug = 'stonewall-inn' OR (name = 'Stonewall Inn' AND address LIKE '%51–53 Christopher St%');

-- Federal Hall National Memorial (26 Wall St) Financial District block 43 lot 6
UPDATE attractions
SET bbl = '1000430006', block = 43, lot = 6
WHERE slug = 'federal-hall-national-memorial' OR (name = 'Federal Hall National Memorial' AND address LIKE '%26 Wall St%');

-- Trinity Church (75 Broadway) Financial District block 49 lot 1
UPDATE attractions
SET bbl = '1000490001', block = 49, lot = 1
WHERE slug = 'trinity-church' OR (name = 'Trinity Church' AND address LIKE '%75 Broadway%');

-- New York Stock Exchange (11 Wall St) Financial District block 26 lot 14
UPDATE attractions
SET bbl = '1000260014', block = 26, lot = 14
WHERE slug = 'new-york-stock-exchange' OR (name = 'New York Stock Exchange' AND address LIKE '%11 Wall St%');

-- Woolworth Building (233 Broadway) Tribeca/Civic Center block 123 lot 22
UPDATE attractions
SET bbl = '1001230022', block = 123, lot = 22
WHERE slug = 'woolworth-building' OR (name = 'Woolworth Building' AND address LIKE '%233 Broadway%');

-- St. Paul's Chapel (209 Broadway) Financial District block 87 lot 1
UPDATE attractions
SET bbl = '1000870001', block = 87, lot = 1
WHERE slug = 'st.-pauls-chapel' OR (name = 'St. Paul''s Chapel' AND address LIKE '%209 Broadway%');

-- Fraunces Tavern (54 Pearl St) Financial District block 7 lot 35
UPDATE attractions
SET bbl = '1000070035', block = 7, lot = 35
WHERE slug = 'fraunces-tavern' OR (name = 'Fraunces Tavern' AND address LIKE '%54 Pearl St%');

-- Cooper Union Foundation Building (7 E 7th St / Cooper Sq) East Village block 465 lot 1
UPDATE attractions
SET bbl = '1004650001', block = 465, lot = 1
WHERE slug = 'cooper-union-foundation-building' OR (name = 'Cooper Union Foundation Building' AND address LIKE '%7 E 7th St / Cooper Sq%');

-- Tenement Museum (97 Orchard St) Lower East Side block 310 lot 2
UPDATE attractions
SET bbl = '1003100002', block = 310, lot = 2
WHERE slug = 'tenement-museum' OR (name = 'Tenement Museum' AND address LIKE '%97 Orchard St%');

-- Eldridge Street Synagogue (12 Eldridge St) Lower East Side/Chinatown block 297 lot 10
UPDATE attractions
SET bbl = '1002970010', block = 297, lot = 10
WHERE slug = 'eldridge-street-synagogue' OR (name = 'Eldridge Street Synagogue' AND address LIKE '%12 Eldridge St%');

-- St. Mark's Church in-the-Bowery (131 E 10th St) East Village block 457 lot 1
UPDATE attractions
SET bbl = '1004570001', block = 457, lot = 1
WHERE slug = 'st.-marks-church-in-the-bowery' OR (name = 'St. Mark''s Church in-the-Bowery' AND address LIKE '%131 E 10th St%');

-- CBGB Building (315 Bowery) (315 Bowery) Bowery/East Village block 448 lot 1
UPDATE attractions
SET bbl = '1004480001', block = 448, lot = 1
WHERE slug = 'cbgb-building-(315-bowery)' OR (name = 'CBGB Building (315 Bowery)' AND address LIKE '%315 Bowery%');

-- Fillmore East (former) (105 Second Ave) East Village block 450 lot 58
UPDATE attractions
SET bbl = '1004500058', block = 450, lot = 58
WHERE slug = 'fillmore-east-(former)' OR (name = 'Fillmore East (former)' AND address LIKE '%105 Second Ave%');

-- McSorley's Old Ale House (15 E 7th St) East Village block 463 lot 5
UPDATE attractions
SET bbl = '1004630005', block = 463, lot = 5
WHERE slug = 'mcsorleys-old-ale-house' OR (name = 'McSorley''s Old Ale House' AND address LIKE '%15 E 7th St%');

-- Merchant's House Museum (29 E 4th St) NoHo block 544 lot 71
UPDATE attractions
SET bbl = '1005440071', block = 544, lot = 71
WHERE slug = 'merchants-house-museum' OR (name = 'Merchant''s House Museum' AND address LIKE '%29 E 4th St%');

-- Puck Building (295 Lafayette St) Nolita/SoHo block 510 lot 45
UPDATE attractions
SET bbl = '1005100045', block = 510, lot = 45
WHERE slug = 'puck-building' OR (name = 'Puck Building' AND address LIKE '%295 Lafayette St%');
