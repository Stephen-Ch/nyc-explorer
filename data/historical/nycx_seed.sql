/* nycx_seed.sql — load attractions & events extracted from research CSVs */
SET NOCOUNT ON;
GO
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'union-square-park-1852',N'Union Square Park',N'Public square opened 1839; by 1852 a residential promenade.',N'Laid out and opened in 1839, Union Square Park was a fenced oval with radiating walks and new plantings. By 1852 it anchored an elite residential district and hosted civic gatherings.',
40.736034,-73.990322,
N'Manhattan',N'Union Square',N'Union Square',N'14th–17th St, Union Sq West/East',
N'14th–17th St, Union Sq West/East, Union Square, Union Square',N'',
1852,N'USQ-1852',
1,
N'["architecture", "politics"]',N'[{"title": "Union Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/history"}, {"title": "Union Square, Manhattan", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square,_Manhattan"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Union_Square_NYC_c1870.jpg", "credit": "Public domain photograph, c.1870 (Wikimedia Commons)", "license": "Public Domain"}]',N'1852');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'union-square-croton-fountain-1852',N'Croton Fountain (Union Square)',N'Central fountain fed by the Croton Aqueduct (installed 1842).',N'A fountain in the center of Union Square was connected to the new Croton Aqueduct in October 1842. In 1852 it remained a prominent feature, symbolizing the city’s modern water supply.',
40.73586,-73.9909,
N'Manhattan',N'Union Square',N'Union Square',N'Union Square Park (center)',
N'Union Square Park (center), Union Square, Union Square',N'',
1852,N'USQ-1852',
2,
N'["infrastructure", "engineering"]',N'[{"title": "Union Square, Manhattan \u2014 Croton fountain note", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square,_Manhattan#Development"}, {"title": "Croton Fountain 1842\u20131870 (marker text)", "publisher": "HMdb.org", "url": "https://www.hmdb.org/m.asp?m=130147"}, {"title": "History of fountains in the United States \u2014 Croton Aqueduct", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/History_of_fountains_in_the_United_States"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Croton_Fountain,_New_York_X_703.jpeg", "credit": "Public domain engraving of Croton-era fountain (Wikimedia Commons)", "license": "Public Domain"}]',N'1852');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'862-866-broadway-rowhouses-1852',N'862–866 Broadway Rowhouses',N'Surviving 1840s rowhouses at the north edge of Union Square.',N'These three- and four‑story brick rowhouses at 862–866 Broadway, present by the 1840s, are cited as surviving remnants of Union Square’s early residential phase and stood here in 1852.',
40.73775,-73.991,
N'Manhattan',N'Union Square',N'Union Square',N'Broadway between E 17th & E 18th St',
N'Broadway between E 17th & E 18th St, Union Square, Union Square',N'',
1852,N'USQ-1852',
3,
N'["architecture", "residential"]',N'[{"title": "Union Square \u2014 early rowhouses 862\u2013866 Broadway", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square,_Manhattan#Development"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:862-872_Broadway.jpg", "credit": "Beyond My Ken (Wikimedia Commons), photo of 862\u2013872 Broadway", "license": "CC-BY-SA"}]',N'1852');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-square-park-1852',N'Madison Square Park',N'Public park opened May 10, 1847; a social hub by 1852.',N'Opened in 1847, Madison Square Park was an elegant public space by 1852, soon to be surrounded by hotels and clubs as development pushed uptown.',
40.742165,-73.988121,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'5th Ave to Madison Ave, 23rd–26th St',
N'5th Ave to Madison Ave, 23rd–26th St, Flatiron District, Flatiron District',N'',
1852,N'FLAT-1852',
1,
N'["architecture", "public-space"]',N'[{"title": "Madison Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/madison-square-park/history"}]',N'[]',N'1852');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-cottage-1852',N'Madison Cottage (road house)',N'Stagecoach inn at Broadway & 23rd (1839–1852), razed in 1852.',N'A farmhouse-turned-roadhouse named for President Madison, Madison Cottage sat at Broadway & 23rd and served travelers. It was demolished in 1852, soon replaced by Franconi’s Hippodrome and later the Fifth Avenue Hotel.',
40.74145,-73.98963,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Broadway & E 23rd St (Madison Square)',
N'Broadway & E 23rd St (Madison Square), Flatiron District, Flatiron District',N'',
1852,N'FLAT-1852',
2,
N'["transportation", "hospitality"]',N'[{"title": "Madison Cottage \u2014 history note", "publisher": "Flatiron/23rd Street Partnership", "url": "https://flatironnomad.nyc/history/madison-cottage/"}, {"title": "Madison Square & Park \u2014 early history (1852 image reference)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Madison_Square_and_Madison_Square_Park"}, {"title": "Madison Cottage \u2014 1852 engraving", "publisher": "Geographic Guide (NYPL image)", "url": "https://www.geographicguide.com/united-states/nyc/antique/madison-square/19th-century/madison-cottage.htm"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Madison_Cottage.jpg", "credit": "Wikimedia Commons (NYPL provenance) \u2014 Madison Cottage illustration", "license": "Public Domain"}]',N'1852');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'free-academy-lexington-23rd-1852',N'Free Academy (City College precursor)',N'James Renwick Jr.’s Gothic Revival Free Academy opened 1849.',N'At Lexington Ave & E 23rd St, the Free Academy (opened 1849) was the city’s pioneering public higher‑education institution; in 1852 its ivy‑clad building was an educational landmark in this district.',
40.73975,-73.9843,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'SE corner Lexington Ave & E 23rd St',
N'SE corner Lexington Ave & E 23rd St, Flatiron District, Flatiron District',N'',
1852,N'FLAT-1852',
3,
N'["education", "architecture"]',N'[{"title": "CUNY \u2014 Origins and Formative Years (Free Academy opens 1849)", "publisher": "City University of New York", "url": "https://www.cuny.edu/about/history/origins-and-formative-years/"}, {"title": "City College of New York \u2014 History & Downtown campus", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/City_College_of_New_York"}, {"title": "Free Academy photo (PD)", "publisher": "Wikimedia Commons", "url": "https://commons.wikimedia.org/wiki/File:Freeacad.jpg"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Freeacad.jpg", "credit": "Wikimedia Commons \u2014 Free Academy image (PD)", "license": "Public Domain"}]',N'1852');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'george-washington-statue-1877',N'Equestrian Statue of George Washington',N'H.K. Brown bronze equestrian statue (ded. 1856).',N'By 1877 Henry Kirke Brown’s equestrian statue of George Washington stood at the south end of Union Square, a focal point for civic gatherings and parades.',
40.73537,-73.9907,
N'Manhattan',N'Union Square',N'Union Square',N'14th St plaza (south end)',
N'14th St plaza (south end), Union Square, Union Square',N'',
1877,N'USQ-1877',
1,
N'["public-art", "politics"]',N'[{"title": "Equestrian statue of George Washington (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/1676"}, {"title": "Equestrian statue of George Washington (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Equestrian_statue_of_George_Washington_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:GWashington_Union_Sq_jeh.jpg", "credit": "Jim.henderson (Wikimedia)", "license": "CC-BY-SA"}]',N'1877');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'abraham-lincoln-statue-1877',N'Statue of Abraham Lincoln',N'Henry Kirke Brown bronze statue (ded. 1870).',N'Henry Kirke Brown’s standing bronze of Abraham Lincoln was installed in 1870 on the north side of Union Square; it remained a prominent monument by 1877.',
40.7366,-73.9903,
N'Manhattan',N'Union Square',N'Union Square',N'North side of Union Square Park',
N'North side of Union Square Park, Union Square, Union Square',N'',
1877,N'USQ-1877',
2,
N'["public-art", "politics"]',N'[{"title": "Abraham Lincoln statue \u2014 Union Square (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/14"}, {"title": "Abraham Lincoln (Union Square statue)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_Abraham_Lincoln_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_statue,_Union_Square,_NYC.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1877');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'lafayette-statue-1877',N'Statue of Marquis de Lafayette',N'Bartholdi bronze (gift of France, 1876).',N'Frédéric Auguste Bartholdi’s statue of the Marquis de Lafayette, installed in 1876, stood on Union Square’s east side in 1877, marking Franco‑American ties.',
40.73568,-73.98997,
N'Manhattan',N'Union Square',N'Union Square',N'East side near 16th St',
N'East side near 16th St, Union Square, Union Square',N'',
1877,N'USQ-1877',
3,
N'["public-art", "politics"]',N'[{"title": "Marquis de Lafayette \u2014 Union Square Park Monuments", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/884"}, {"title": "Statue of the Marquis de Lafayette (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_the_Marquis_de_Lafayette_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Lafayette_statue_Union_Square.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1877');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'liberty-arm-torch-1877',N'Statue of Liberty Arm & Torch (exhibit)',N'Liberty’s forearm & torch displayed in Madison Square Park (1876–1882) for fundraising.',N'To raise funds for the pedestal, the Statue of Liberty’s forearm and torch were exhibited in Madison Square Park from 1876 into the early 1880s; visitors could climb the torch. In 1877 it was a headline attraction.',
40.7423,-73.988,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Madison Square Park (central lawn)',
N'Madison Square Park (central lawn), Flatiron District, Flatiron District',N'',
1877,N'FLAT-1877',
1,
N'["public-art", "politics"]',N'[{"title": "Statue of Liberty \u2014 Early fundraising exhibitions", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_Liberty#Fund-raising_and_assembly"}, {"title": "Madison Square Park \u2014 History timeline (torch exhibit)", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/park/about-the-park/"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Arm_and_torch_of_the_Statue_of_Liberty_in_Madison_Square_Park,_New_York,_c._1876.jpg", "credit": "Wikimedia Commons (c.1876 photo)", "license": "Public Domain"}]',N'1877');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'william-h-seward-statue-1877',N'Statue of William H. Seward',N'Randolph Rogers bronze (ded. 1876) in Madison Square Park.',N'The bronze statue of Secretary of State William Henry Seward by Randolph Rogers was unveiled in 1876 near the park’s southwest corner; by 1877 it drew crowds in the busy square.',
40.74245,-73.9891,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Madison Square Park (SW corner)',
N'Madison Square Park (SW corner), Flatiron District, Flatiron District',N'',
1877,N'FLAT-1877',
2,
N'["public-art", "politics"]',N'[{"title": "Statue of William Henry Seward \u2014 MSPC page", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/art/statue-of-william-henry-seward/"}, {"title": "Statue of William Henry Seward", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_William_Henry_Seward_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:William_Henry_Seward_statue,_Madison_Square_Park.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1877');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'fifth-avenue-hotel-1877',N'Fifth Avenue Hotel',N'Luxury hotel at 200 Fifth Ave (opened 1859; a social center by 1877).',N'The Fifth Avenue Hotel, opened 1859 at Fifth Ave & 23rd St, was one of the city’s premier hotels; in 1877 it dominated Madison Square with political and society events.',
40.74184,-73.98965,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'200 Fifth Ave (NW corner at 23rd)',
N'200 Fifth Ave (NW corner at 23rd), Flatiron District, Flatiron District',N'',
1877,N'FLAT-1877',
3,
N'["commerce", "politics"]',N'[{"title": "Fifth Avenue Hotel", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Fifth_Avenue_Hotel"}, {"title": "Daytonian in Manhattan \u2014 The Fifth Avenue Hotel", "publisher": "Daytonian in Manhattan", "url": "http://daytoninmanhattan.blogspot.com/2010/08/fifth-avenue-hotel.html"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Fifth_Avenue_Hotel,_New_York_(NYPL_b11707585-G90F212_006F).tiff", "credit": "NYPL via Wikimedia Commons", "license": "Public Domain"}]',N'1877');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'union-square-park-1902',N'Union Square Park',N'Historic civic plaza with monuments and promenades.',N'By 1902 Union Square Park was an established civic square, known for public gatherings and 19th‑century monuments such as Washington and Lafayette. The park’s role as a rally site and promenade continued into the new century.',
40.736034,-73.990322,
N'Manhattan',N'Union Square',N'Union Square',N'Union Square Park (14th–17th St)',
N'Union Square Park (14th–17th St), Union Square, Union Square',N'',
1902,N'USQ-1902',
1,
N'["architecture", "politics"]',N'[{"title": "Union Square, Manhattan (history & art)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square,_Manhattan"}]',N'[]',N'1902');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'george-washington-statue-1902',N'Equestrian Statue of George Washington',N'1856 bronze equestrian statue by H.K. Brown.',N'The bronze equestrian statue of George Washington (dedicated 1856) stood at the park’s south end in 1902, anchoring the square’s historic axis.',
40.73537,-73.9907,
N'Manhattan',N'Union Square',N'Union Square',N'14th St plaza (south end)',
N'14th St plaza (south end), Union Square, Union Square',N'',
1902,N'USQ-1902',
2,
N'["public-art"]',N'[{"title": "Equestrian statue of George Washington (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/1676"}, {"title": "Equestrian statue of George Washington (Wikipedia)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Equestrian_statue_of_George_Washington_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Nyc_union_square_equestrian_statue_of_george_washington_nov.2024.jpg", "credit": "Wikimedia Commons uploader", "license": "CC0"}, {"url": "https://commons.wikimedia.org/wiki/File:GWashington_Union_Sq_jeh.jpg", "credit": "Jim.henderson (Wikimedia)", "license": "CC-BY-SA"}]',N'1902');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'lafayette-statue-1902',N'Statue of Marquis de Lafayette',N'Bartholdi’s bronze tribute, dedicated 1876.',N'Frédéric Auguste Bartholdi’s statue of Lafayette, a French ally in the Revolution, stood on the park’s east side in 1902.',
40.73568,-73.98997,
N'Manhattan',N'Union Square',N'Union Square',N'East side near 16th St',
N'East side near 16th St, Union Square, Union Square',N'',
1902,N'USQ-1902',
3,
N'["public-art"]',N'[{"title": "Marquis de Lafayette \u2013 Union Square Park Monuments", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/884"}, {"title": "Statue of the Marquis de Lafayette (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_the_Marquis_de_Lafayette_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Lafayette_statue_Union_Square.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}, {"url": "https://commons.wikimedia.org/wiki/File:(King1893NYC)_pg186_LAFAYETTE_STATUE,_IN_UNION_SQARE.jpg", "credit": "King\u2019s Handbook of New York (1893)", "license": "Public Domain"}]',N'1902');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'flatiron-building-1902',N'Flatiron Building',N'22‑story triangular skyscraper opened 1902.',N'Daniel Burnham’s steel‑frame Flatiron Building opened in 1902 at Fifth Avenue, Broadway, and 23rd Street, becoming an instant icon of New York’s skyline.',
40.741112,-73.989723,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'175 Fifth Ave (E 22nd–23rd)',
N'175 Fifth Ave (E 22nd–23rd), Flatiron District, Flatiron District',N'',
1902,N'FLAT-1902',
1,
N'["architecture"]',N'[{"title": "Flatiron Building", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Flatiron_Building"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Flatiron_Building_1902.jpg", "credit": "Wikimedia Commons (early 1900s photo)", "license": "Public Domain"}, {"url": "https://commons.wikimedia.org/wiki/File:FlatIronBuildingPostcardTramsEarlyCentury.JPG", "credit": "Wikimedia Commons (early postcard)", "license": "Public Domain"}]',N'1902');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'worth-monument-1902',N'General William Jenkins Worth Monument',N'1857 granite obelisk in Worth Square.',N'The 51‑foot obelisk honoring General Worth, dedicated in 1857, anchored Worth Square by 1902 at Broadway and 24th Street.',
40.74276,-73.988974,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Worth Square (Broadway & W 24th)',
N'Worth Square (Broadway & W 24th), Flatiron District, Flatiron District',N'',
1902,N'FLAT-1902',
2,
N'["public-art"]',N'[{"title": "General William Jenkins Worth Monument", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/General_William_Jenkins_Worth_Monument"}, {"title": "Worth Square", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Worth_Square"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:William_Jenkins_Worth_monument_4,_from_Robert_N._Dennis_collection_of_stereoscopic_views.jpg", "credit": "NYPL Robert N. Dennis collection (via Commons)", "license": "Public Domain"}, {"url": "https://commons.wikimedia.org/wiki/File:WJWorthMonumentFull.JPG", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1902');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-square-park-1902',N'Madison Square Park',N'Downtown park and social hub by 1902.',N'Opened in 1847, Madison Square Park was a manicured public square by 1902, surrounded by emerging skyscrapers and used for civic events.',
40.742165,-73.988121,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'5th Ave (E 23rd–26th)',
N'5th Ave (E 23rd–26th), Flatiron District, Flatiron District',N'',
1902,N'FLAT-1902',
3,
N'["architecture", "public-art"]',N'[{"title": "Madison Square Park Conservancy \u2013 About the Park", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/park/about-the-park/"}]',N'[]',N'1902');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'george-washington-statue-1927',N'Equestrian Statue of George Washington',N'H.K. Brown bronze equestrian statue (ded. 1856).',N'By 1927 Henry Kirke Brown’s equestrian statue of George Washington still anchored the south end of Union Square, a long‑standing focal point for civic gatherings.',
40.73537,-73.9907,
N'Manhattan',N'Union Square',N'Union Square',N'14th St plaza (south end)',
N'14th St plaza (south end), Union Square, Union Square',N'',
1927,N'USQ-1927',
1,
N'["public-art", "politics"]',N'[{"title": "Equestrian statue of George Washington (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/1676"}, {"title": "Equestrian statue of George Washington (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Equestrian_statue_of_George_Washington_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:GWashington_Union_Sq_jeh.jpg", "credit": "Jim.henderson (Wikimedia)", "license": "CC-BY-SA"}]',N'1927');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'abraham-lincoln-statue-1927',N'Statue of Abraham Lincoln',N'Henry Kirke Brown bronze statue (ded. 1870).',N'By 1927 Brown’s 1870 bronze of Abraham Lincoln stood on the park’s north side, continuing as a symbol of civic memory in Union Square.',
40.7366,-73.9903,
N'Manhattan',N'Union Square',N'Union Square',N'North side of Union Square Park',
N'North side of Union Square Park, Union Square, Union Square',N'',
1927,N'USQ-1927',
2,
N'["public-art", "politics"]',N'[{"title": "Abraham Lincoln statue \u2014 Union Square (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/14"}, {"title": "Abraham Lincoln (Union Square statue)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_Abraham_Lincoln_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_statue,_Union_Square,_NYC.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1927');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'lafayette-statue-1927',N'Statue of Marquis de Lafayette',N'Bartholdi bronze (gift of France, 1876).',N'Frédéric Auguste Bartholdi’s statue of the Marquis de Lafayette (installed 1876) remained on Union Square’s east side in 1927, marking Franco‑American ties.',
40.73568,-73.98997,
N'Manhattan',N'Union Square',N'Union Square',N'East side near 16th St',
N'East side near 16th St, Union Square, Union Square',N'',
1927,N'USQ-1927',
3,
N'["public-art", "politics"]',N'[{"title": "Marquis de Lafayette \u2014 Union Square Park Monuments", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/884"}, {"title": "Statue of the Marquis de Lafayette (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_the_Marquis_de_Lafayette_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Lafayette_statue_Union_Square.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1927');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-square-park-1927',N'Madison Square Park',N'Historic urban park and civic space.',N'In 1927 Madison Square Park’s lawns, promenades, and monuments formed a mature civic landscape, a lunch‑hour hub framed by early skyscrapers.',
40.742165,-73.988121,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'5th Ave (E 23rd–26th)',
N'5th Ave (E 23rd–26th), Flatiron District, Flatiron District',N'',
1927,N'FLAT-1927',
1,
N'["architecture", "public-art"]',N'[{"title": "Madison Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/madison-square-park/history"}, {"title": "Madison Square Park Conservancy \u2014 About the Park", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/park/about-the-park/"}]',N'[]',N'1927');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'worth-monument-1927',N'General William Jenkins Worth Monument',N'1857 granite obelisk in Worth Square.',N'By 1927 the 51‑foot granite obelisk honoring General Worth remained the centerpiece of Worth Square at Broadway & 24th Street.',
40.74276,-73.988974,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Worth Square (Broadway & W 24th)',
N'Worth Square (Broadway & W 24th), Flatiron District, Flatiron District',N'',
1927,N'FLAT-1927',
2,
N'["public-art"]',N'[{"title": "General William Jenkins Worth Monument", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/General_William_Jenkins_Worth_Monument"}, {"title": "Worth Square", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Worth_Square"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:William_Jenkins_Worth_monument_4,_from_Robert_N._Dennis_collection_of_stereoscopic_views.jpg", "credit": "NYPL Robert N. Dennis collection (via Commons)", "license": "Public Domain"}]',N'1927');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'metropolitan-life-tower-1927',N'Metropolitan Life Insurance Company Tower',N'Skyscraper with clock tower (completed 1909).',N'East of the park, the Metropolitan Life Tower (completed 1909) dominated the skyline in 1927. Modeled on Venice’s Campanile, it symbolized early 20th‑century corporate architecture.',
40.7414,-73.9876,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'1 Madison Ave (E 23rd & Madison)',
N'1 Madison Ave (E 23rd & Madison), Flatiron District, Flatiron District',N'',
1927,N'FLAT-1927',
3,
N'["architecture", "commerce"]',N'[{"title": "Metropolitan Life Insurance Company Tower", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Metropolitan_Life_Insurance_Company_Tower"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Metropolitan_Life_Tower_c1911.jpg", "credit": "Wikimedia Commons (c.1911 photo)", "license": "Public Domain"}]',N'1927');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'george-washington-statue-1952',N'Equestrian Statue of George Washington',N'H.K. Brown bronze equestrian statue (ded. 1856).',N'In 1952 Henry Kirke Brown’s bronze of George Washington still anchored the south end of Union Square, a long-standing focal point for civic gatherings.',
40.73537,-73.9907,
N'Manhattan',N'Union Square',N'Union Square',N'14th St plaza (south end)',
N'14th St plaza (south end), Union Square, Union Square',N'',
1952,N'USQ-1952',
1,
N'["public-art", "politics"]',N'[{"title": "Equestrian statue of George Washington (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/1676"}, {"title": "Equestrian statue of George Washington (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Equestrian_statue_of_George_Washington_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:GWashington_Union_Sq_jeh.jpg", "credit": "Jim.henderson (Wikimedia)", "license": "CC-BY-SA"}]',N'1952');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'abraham-lincoln-statue-1952',N'Statue of Abraham Lincoln',N'Henry Kirke Brown bronze statue (ded. 1870).',N'By 1952 Brown’s 1870 bronze of Abraham Lincoln stood on the park’s north side, continuing as a symbol of civic memory in Union Square.',
40.7366,-73.9903,
N'Manhattan',N'Union Square',N'Union Square',N'North side of Union Square Park',
N'North side of Union Square Park, Union Square, Union Square',N'',
1952,N'USQ-1952',
2,
N'["public-art", "politics"]',N'[{"title": "Abraham Lincoln statue \u2014 Union Square (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/14"}, {"title": "Statue of Abraham Lincoln (Union Square)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_Abraham_Lincoln_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_statue,_Union_Square,_NYC.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1952');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'lafayette-statue-1952',N'Statue of Marquis de Lafayette',N'Frédéric Auguste Bartholdi bronze (gift of France, 1876).',N'In 1952 Bartholdi’s statue of the Marquis de Lafayette remained on Union Square’s east side, marking Franco‑American ties.',
40.73568,-73.98997,
N'Manhattan',N'Union Square',N'Union Square',N'East side near 16th St',
N'East side near 16th St, Union Square, Union Square',N'',
1952,N'USQ-1952',
3,
N'["public-art", "politics"]',N'[{"title": "Marquis de Lafayette \u2014 Union Square Park Monuments", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/884"}, {"title": "Statue of the Marquis de Lafayette (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_the_Marquis_de_Lafayette_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Lafayette_statue_Union_Square.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1952');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-square-park-1952',N'Madison Square Park',N'Historic downtown park and lunch-hour hub.',N'By 1952 Madison Square Park’s lawns, promenades, and monuments formed a mature civic landscape, with postwar amenities and steady community use.',
40.742165,-73.988121,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'5th Ave (E 23rd–26th)',
N'5th Ave (E 23rd–26th), Flatiron District, Flatiron District',N'',
1952,N'FLAT-1952',
1,
N'["architecture", "public-art"]',N'[{"title": "Madison Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/madison-square-park/history"}, {"title": "Madison Square Park Conservancy \u2014 About the Park", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/park/about-the-park/"}]',N'[]',N'1952');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'worth-monument-1952',N'General William Jenkins Worth Monument',N'1857 granite obelisk in Worth Square.',N'The 51‑foot granite obelisk honoring General Worth remained the centerpiece of Worth Square at Broadway & 24th Street in 1952.',
40.74276,-73.988974,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Worth Square (Broadway & W 24th)',
N'Worth Square (Broadway & W 24th), Flatiron District, Flatiron District',N'',
1952,N'FLAT-1952',
2,
N'["public-art"]',N'[{"title": "General William Jenkins Worth Monument", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/General_William_Jenkins_Worth_Monument"}, {"title": "Worth Square", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Worth_Square"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:William_Jenkins_Worth_monument_4,_from_Robert_N._Dennis_collection_of_stereoscopic_views.jpg", "credit": "NYPL Robert N. Dennis collection (via Commons)", "license": "Public Domain"}, {"url": "https://commons.wikimedia.org/wiki/File:WJWorthMonumentFull.JPG", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1952');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'metropolitan-life-tower-1952',N'Metropolitan Life Insurance Company Tower',N'Clock-tower skyscraper (completed 1909).',N'East of the park, the Metropolitan Life Tower (completed 1909) dominated the skyline in 1952. Modeled on Venice’s Campanile, it symbolized early 20th‑century corporate architecture.',
40.7414,-73.9876,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'1 Madison Ave (E 23rd & Madison)',
N'1 Madison Ave (E 23rd & Madison), Flatiron District, Flatiron District',N'',
1952,N'FLAT-1952',
3,
N'["architecture", "commerce"]',N'[{"title": "Metropolitan Life Insurance Company Tower", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Metropolitan_Life_Insurance_Company_Tower"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Metropolitan_Life_Tower_c1911.jpg", "credit": "Wikimedia Commons (c.1911 photo)", "license": "Public Domain"}]',N'1952');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'george-washington-statue-1977',N'Equestrian Statue of George Washington',N'H.K. Brown bronze equestrian statue (1856).',N'By 1977 the 1856 bronze equestrian statue of George Washington continued to anchor Union Square’s south end and civic memory.',
40.73537,-73.9907,
N'Manhattan',N'Union Square',N'Union Square',N'14th St plaza (south end)',
N'14th St plaza (south end), Union Square, Union Square',N'',
1977,N'USQ-1977',
1,
N'["public-art", "politics"]',N'[{"title": "Equestrian statue of George Washington (NYC Parks)", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/monuments/1676"}, {"title": "Equestrian statue of George Washington (NYC)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Equestrian_statue_of_George_Washington_(New_York_City)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:GWashington_Union_Sq_jeh.jpg", "credit": "Jim.henderson (Wikimedia)", "license": "CC-BY-SA"}]',N'1977');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'tammany-hall-building-1977',N'Tammany Hall (44 Union Square East)',N'Neo‑Georgian former Democratic machine HQ (opened 1929).',N'The 1929 Tammany Hall building at 44 Union Square East still stood in 1977; its association with NYC political power made it a local landmark.',
40.73639,-73.98889,
N'Manhattan',N'Union Square',N'Union Square',N'E 17th St & Union Square East',
N'E 17th St & Union Square East, Union Square, Union Square',N'',
1977,N'USQ-1977',
2,
N'["politics", "architecture", "scandal"]',N'[{"title": "44 Union Square (Tammany Hall)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/44_Union_Square"}, {"title": "The 1929 Tammany Hall \u2014 No. 100 East 17th Street", "publisher": "Daytonian in Manhattan", "url": "http://daytoninmanhattan.blogspot.com/2014/07/the-1929-tammany-hall-no-100-east-17th.html"}]',N'[]',N'1977');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'maxs-kansas-city-1977',N'Max’s Kansas City (213 Park Ave South)',N'Influential art/music club and restaurant (1965–1981).',N'A magnet for artists and musicians—Velvet Underground, Bowie, Warhol’s circle—Max’s Kansas City remained a cultural touchstone in 1977 near Union Square.',
40.7373,-73.98775,
N'Manhattan',N'Union Square',N'Union Square',N'213 Park Ave S (at E 17th St)',
N'213 Park Ave S (at E 17th St), Union Square, Union Square',N'',
1977,N'USQ-1977',
3,
N'["music", "celebrity", "culture"]',N'[{"title": "Max\u2019s Kansas City", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Max%27s_Kansas_City"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Max%27s_Kansas_City.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1977');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-square-park-1977',N'Madison Square Park',N'Historic park showing signs of revival in the 1970s.',N'In 1977 the park’s historic layout persisted amid urban wear, with community events and chess tables hinting at the coming restorations of the 1990s–2000s.',
40.742165,-73.988121,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'5th Ave (E 23rd–26th)',
N'5th Ave (E 23rd–26th), Flatiron District, Flatiron District',N'',
1977,N'FLAT-1977',
1,
N'["culture", "public-art"]',N'[{"title": "Madison Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/madison-square-park/history"}, {"title": "Madison Square Park Conservancy \u2014 About the Park", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/park/about-the-park/"}]',N'[]',N'1977');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'worth-monument-1977',N'General William Jenkins Worth Monument',N'1857 granite obelisk in Worth Square.',N'The 51‑foot granite obelisk honoring General Worth remained the centerpiece of Worth Square by 1977.',
40.74276,-73.988974,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'Worth Square (Broadway & W 24th)',
N'Worth Square (Broadway & W 24th), Flatiron District, Flatiron District',N'',
1977,N'FLAT-1977',
2,
N'["public-art"]',N'[{"title": "General William Jenkins Worth Monument", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/General_William_Jenkins_Worth_Monument"}, {"title": "Worth Square", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Worth_Square"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:William_Jenkins_Worth_monument_4,_from_Robert_N._Dennis_collection_of_stereoscopic_views.jpg", "credit": "NYPL Robert N. Dennis collection (via Commons)", "license": "Public Domain"}]',N'1977');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'new-york-life-building-1977',N'New York Life Building',N'Cass Gilbert’s gilded‑roof tower (completed 1928).',N'At Madison Ave & E 26th St, the New York Life Building, completed 1928 with a gilded pyramidal roof, defined the neighborhood skyline in 1977.',
40.7431,-73.98755,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'51 Madison Ave (at E 26th)',
N'51 Madison Ave (at E 26th), Flatiron District, Flatiron District',N'',
1977,N'FLAT-1977',
3,
N'["architecture", "commerce"]',N'[{"title": "New York Life Building", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/New_York_Life_Building"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:New_York_Life_Building_2011.JPG", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'1977');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'union-square-park-2002',N'Union Square Park (post‑1990s restoration)',N'Restored urban park & major Greenmarket site.',N'Following 1990s restorations, Union Square Park was an active civic space in 2002, hosting the Greenmarket and public gatherings.',
40.736034,-73.990322,
N'Manhattan',N'Union Square',N'Union Square',N'14th–17th St, Union Sq West/East',
N'14th–17th St, Union Sq West/East, Union Square, Union Square',N'',
2002,N'USQ-2002',
1,
N'["architecture", "commerce"]',N'[{"title": "Union Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/history"}, {"title": "Greenmarket at Union Square", "publisher": "GrowNYC", "url": "https://www.grownyc.org/greenmarket/manhattan-union-square"}]',N'[]',N'2002');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'metronome-2002',N'Metronome (One Union Square South)',N'Large‑scale public art & timepiece by Devlin & Kuspit (1999).',N'Installed in 1999 on the facade facing Union Square, Metronome’s digital ‘The Passage’ clock and sculptural elements remained a prominent feature in 2002.',
40.73518,-73.99007,
N'Manhattan',N'Union Square',N'Union Square',N'14th St & Broadway (south side)',
N'14th St & Broadway (south side), Union Square, Union Square',N'',
2002,N'USQ-2002',
2,
N'["public-art"]',N'[{"title": "Metronome (Union Square)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Metronome_(public_artwork)"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Metronome_-_Union_Square.jpg", "credit": "Wikimedia Commons", "license": "CC-BY-SA"}]',N'2002');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'daryl-roth-theatre-2002',N'Daryl Roth Theatre (former Union Square Savings Bank)',N'Landmark bank building re‑used as theatre (1996→).',N'At 20 Union Square East, the 1906 bank building found new life as the Daryl Roth Theatre in the late 1990s; by 2002 it was an active performance venue.',
40.73595,-73.9891,
N'Manhattan',N'Union Square',N'Union Square',N'20 Union Square East (at 15th St)',
N'20 Union Square East (at 15th St), Union Square, Union Square',N'',
2002,N'USQ-2002',
3,
N'["theatre", "architecture"]',N'[{"title": "Daryl Roth Theatre (building history)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square_Savings_Bank"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Union_Square_Savings_Bank,_New_York,_NY.jpg", "credit": "Beyond My Ken (Wikimedia)", "license": "CC-BY-SA"}]',N'2002');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'flatiron-building-2002',N'Flatiron Building',N'Century‑old triangular skyscraper and district icon.',N'In 2002 the 1902 Flatiron Building remained an iconic landmark at Fifth Avenue, Broadway, and 23rd Street, housing offices and retail.',
40.741112,-73.989723,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'175 Fifth Ave (E 22nd–23rd)',
N'175 Fifth Ave (E 22nd–23rd), Flatiron District, Flatiron District',N'',
2002,N'FLAT-2002',
1,
N'["architecture"]',N'[{"title": "Flatiron Building", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Flatiron_Building"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Flatiron_Building_1902.jpg", "credit": "Wikimedia Commons (early 1900s photo)", "license": "Public Domain"}]',N'2002');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'madison-square-park-2002',N'Madison Square Park (renovated)',N'Major restoration completed around 2001; art program launches.',N'By 2002, the park’s restoration had revived lawns, paths, and monuments and laid groundwork for contemporary public‑art programming.',
40.742165,-73.988121,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'5th Ave (E 23rd–26th)',
N'5th Ave (E 23rd–26th), Flatiron District, Flatiron District',N'',
2002,N'FLAT-2002',
2,
N'["architecture", "public-art"]',N'[{"title": "Madison Square Park Conservancy \u2014 About the Park", "publisher": "Madison Square Park Conservancy", "url": "https://madisonsquarepark.org/park/about-the-park/"}]',N'[]',N'2002');
INSERT INTO nycx.attractions
(id,name,summary,description,lat,lng,borough,neighborhood,area,block_label,address_hint,bbl,year,route_id,display_order,tags_json,sources_json,images_json,year_file)
VALUES (N'metropolitan-life-tower-2002',N'Metropolitan Life Insurance Company Tower',N'Clock‑tower skyscraper still defining the skyline.',N'The 1909 Met Life Tower continued to dominate the east side of the park in 2002, with its clock faces and campanile form a neighborhood beacon.',
40.7414,-73.9876,
N'Manhattan',N'Flatiron District',N'Flatiron District',N'1 Madison Ave (E 23rd & Madison)',
N'1 Madison Ave (E 23rd & Madison), Flatiron District, Flatiron District',N'',
2002,N'FLAT-2002',
3,
N'["architecture", "commerce"]',N'[{"title": "Metropolitan Life Insurance Company Tower", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Metropolitan_Life_Insurance_Company_Tower"}]',N'[{"url": "https://commons.wikimedia.org/wiki/File:Metropolitan_Life_Tower_c1911.jpg", "credit": "Wikimedia Commons (c.1911 photo)", "license": "Public Domain"}]',N'2002');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-great-union-meeting-1861-04-20',N'Great Union Meeting after Fort Sumter',
N'1861-04-20',NULL,
0,
NULL,N'Union Square',N'Union Square',
40.7359,-73.9911,
N'',N'["politics", "history"]',N'["Maj. Robert Anderson"]',
N'Vast pro‑Union rally following the fall of Fort Sumter; among the largest public gatherings in U.S. up to that time.',N'A massive patriotic rally assembled in Union Square just days after the attack on Fort Sumter. Major Robert Anderson brought the Fort Sumter flag; press accounts estimated crowds well over 100,000.',N'[{"title": "Union Square, Manhattan \u2014 Social and political activism", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square,_Manhattan"}, {"title": "Union Square \u2014 Top 10 Famous Protest Sites", "publisher": "TIME", "url": "https://content.time.com/time/specials/packages/article/0,28804,2047066_2047070_2047092,00.html"}, {"title": "New York State Military Museum \u2014 New York City in the Civil War", "publisher": "DMNA", "url": "https://museum.dmna.ny.gov/unit-history/conflict/us-civil-war-1861-1865/counties-state-new-york-during-war-rebellion/new-york-city-civil-war"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-first-labor-day-parade-1882-09-05',N'First Labor Day Parade',
N'1882-09-05',NULL,
0,
NULL,N'Union Square',N'Union Square',
40.7359,-73.9911,
N'',N'["labor", "politics", "culture"]',N'["Central Labor Union"]',
N'Parade organized by the Central Labor Union marched from City Hall, circled Union Square, and headed to 42nd St.',N'Roughly 10,000 workers participated in the first Labor Day parade. Reviewing stands were set up at Union Square; the route proceeded up Broadway and continued toward Reservoir Square.',N'[{"title": "Labor Daze \u2014 Pride, Chaos and Kegs on Labor''s First ''Day''", "publisher": "U.S. Department of Labor", "url": "https://www.dol.gov/general/laborday/history-daze"}, {"title": "The First Labor Day Parade", "publisher": "NASA Earth Observatory", "url": "https://www.earthobservatory.nasa.gov/images/154731/the-first-labor-day-parade"}, {"title": "Union Square Park \u2014 History", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/union-square-park/history"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-emma-goldman-arrest-1893-08',N'Emma Goldman arrested after Union Square speech',
N'1893-08-21',NULL,
0,
NULL,N'Union Square',N'Union Square',
40.7359,-73.9911,
N'',N'["politics", "speech", "arrest"]',N'["Emma Goldman"]',
N'Goldman urged the unemployed to demand bread; later convicted of inciting a riot and sentenced to one year.',N'At a mass demonstration of the unemployed at Union Square, Goldman delivered a fiery speech; she was soon arrested, convicted of incitement, and served a one‑year sentence.',N'[{"title": "Emma Goldman \u2014 First Amendment Encyclopedia", "publisher": "MTSU", "url": "https://firstamendment.mtsu.edu/article/emma-goldman/"}, {"title": "Union Square: Activism by Design", "publisher": "Village Preservation", "url": "https://www.villagepreservation.org/2014/12/10/union-square-activism-by-design/"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-unemployment-day-1930-03-06',N'International Unemployment Day Demonstration',
N'1930-03-06',NULL,
0,
NULL,N'Union Square',N'Union Square',
40.7359,-73.9911,
N'',N'["labor", "politics", "protest"]',N'["William Z. Foster", "Sam Darcy"]',
N'Tens of thousands rallied in Union Square; clashes with police followed as marchers sought to proceed to City Hall.',N'Part of coordinated worldwide protests during the early Great Depression, the New York action centered on Union Square, where speeches and confrontations with police marked the day.',N'[{"title": "International Unemployment Day", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/International_Unemployment_Day"}, {"title": "From the archive: Red assemblies in US cities", "publisher": "The Guardian (archive)", "url": "https://www.theguardian.com/theguardian/2013/mar/07/communism-protests-unemployment-day-1930"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-9-11-vigils-2001-09',N'9/11 Vigils and Spontaneous Memorials',
N'2001-09-12',N'2001-10-01',
1,
NULL,N'Union Square',N'Union Square',
40.7359,-73.9911,
N'',N'["memorial", "culture", "politics"]',N'[]',
N'Union Square became a principal gathering place for candlelight vigils and ad hoc memorials after the attacks.',N'In the days and weeks following September 11, 2001, Union Square Park served as a central space for public mourning, with candles, posters of the missing, and nightly vigils.',N'[{"title": "Union Square, Manhattan \u2014 History", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Union_Square,_Manhattan"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-biograph-studio-era-1906-1913',N'Biograph Studio at 11 East 14th Street',
N'1906-01-01',N'1913-12-31',
1,
NULL,N'Union Square',N'Union Square',
40.73514,-73.9916,
N'',N'["cinema", "technology", "culture"]',N'["D. W. Griffith", "Mary Pickford", "Lillian Gish"]',
N'American Mutoscope and Biograph operated an indoor studio at 11 E 14th St, where Griffith directed early films.',N'Biograph moved its operations to 11 East 14th Street in 1906; the studio became a crucible of early cinema, with D.W. Griffith directing and actors like Mary Pickford and the Gish sisters appearing in shorts.',N'[{"title": "Biograph Company \u2014 Studio section", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Biograph_Company"}, {"title": "Biograph Studios \u2014 Manhattan locations", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Biograph_Studios"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'usq-velvet-underground-live-1970-08-23',N'Velvet Underground — ''Live at Max’s Kansas City'' Recording',
N'1970-08-23',NULL,
0,
NULL,N'Union Square',N'Union Square',
40.7373,-73.98775,
N'',N'["music", "celebrity", "culture"]',N'["Lou Reed", "The Velvet Underground", "Brigid Polk"]',
N'A landmark live album was recorded at Max’s Kansas City, a few blocks east of Union Square.',N'Brigid Polk’s cassette recordings of the Velvet Underground’s performance at Max’s on August 23, 1970 became the foundation for the influential live album released in 1972.',N'[{"title": "Max\u2019s Kansas City", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Max%27s_Kansas_City"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-liberty-arm-torch-1876-1882',N'Statue of Liberty Arm & Torch on Display',
N'1876-09-01',N'1882-01-01',
1,
NULL,N'Madison Square Park',N'Flatiron District',
40.74228,-73.98768,
N'',N'["public-art", "fundraising", "culture"]',N'["Fr\u00e9d\u00e9ric Auguste Bartholdi"]',
N'The statue’s arm and torch were exhibited in Madison Square Park to raise funds for the pedestal.',N'After the 1876 Centennial, Liberty’s arm and torch were installed at Madison Square Park, where visitors could climb the torch for fifty cents to support the pedestal campaign.',N'[{"title": "Statue of Liberty \u2014 Early history", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Statue_of_Liberty"}, {"title": "The Arm That Clutched the Torch", "publisher": "NYPL", "url": "https://www.nypl.org/blog/2015/04/07/statue-liberty-pedestal"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-stanford-white-murder-1906-06-25',N'Murder of Stanford White at Madison Square Garden',
N'1906-06-25',NULL,
0,
NULL,N'Madison Square Garden (2nd)',N'Flatiron District',
40.74284,-73.98795,
N'',N'["true-crime", "celebrity", "theatre"]',N'["Stanford White", "Harry K. Thaw", "Evelyn Nesbit"]',
N'Architect Stanford White was shot by Harry K. Thaw on the Garden’s rooftop theatre during a musical.',N'The sensational killing, widely dubbed the ''trial of the century,'' occurred atop Madison Square Garden (1890), designed by White’s own firm, McKim, Mead & White.',N'[{"title": "Madison Square Garden (1890)", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Madison_Square_Garden_(1890)"}, {"title": "Murder of the Century", "publisher": "PBS American Experience", "url": "https://www.pbs.org/wgbh/americanexperience/films/century/"}, {"title": "Murder at the Garden \u2014 Famous Trials", "publisher": "UMKC/Famous Trials", "url": "https://famous-trials.com/thaw/403-murder"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-armory-show-1913-02-17',N'The 1913 Armory Show (International Exhibition of Modern Art)',
N'1913-02-17',N'1913-03-15',
0,
NULL,N'69th Regiment Armory',N'Flatiron District',
40.74188,-73.98366,
N'',N'["art", "exhibition", "culture"]',N'["Association of American Painters and Sculptors"]',
N'The landmark modern art exhibition opened at the 69th Regiment Armory on Lexington Ave between 25th and 26th Streets.',N'Introducing American audiences to modern European and American art, the Armory Show was staged in the vast drill hall of the 69th Regiment Armory, a few blocks east of Madison Square Park.',N'[{"title": "Armory Show", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Armory_Show"}, {"title": "69th Regiment Armory", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/69th_Regiment_Armory"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-eternal-light-dedication-1923-11-11',N'Eternal Light Flagstaff Switched On (Armistice Day)',
N'1923-11-11',NULL,
0,
NULL,N'Madison Square Park',N'Flatiron District',
40.74294,-73.98831,
N'',N'["memorial", "politics", "history"]',N'["Thomas Hastings", "Paul Wayland Bartlett", "Rodman Wanamaker"]',
N'WWI memorial light first illuminated during Armistice Day ceremonies in Madison Square Park.',N'Designed by architect Thomas Hastings with sculpture by Paul Wayland Bartlett, the flagstaff’s light has served as a perpetual memorial to the fallen since November 11, 1923.',N'[{"title": "Eternal Light Flagstaff", "publisher": "NYC Parks", "url": "https://www.nycgovparks.org/parks/madison-square-park/monuments/961"}, {"title": "Eternal Light Flagstaff", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Eternal_Light_Flagstaff"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-lindbergh-wreath-1927-06-14',N'Charles Lindbergh Places Wreath at Eternal Light',
N'1927-06-14',NULL,
0,
NULL,N'Madison Square Park',N'Flatiron District',
40.74294,-73.98831,
N'',N'["memorial", "celebrity", "culture"]',N'["Charles A. Lindbergh"]',
N'During a celebratory parade, Lindbergh stopped at Madison Square Park to lay a wreath at the Eternal Light Flagstaff.',N'The Lindbergh parade drew enormous crowds; at Madison Square Park, he honored the WWI memorial with a wreath, a moment noted in contemporary press.',N'[{"title": "Eternal Light Flagstaff \u2014 Lindbergh note", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Eternal_Light_Flagstaff"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-amen-corner-1890s',N'‘Amen Corner’ at the Fifth Avenue Hotel',
N'1890-01-01',N'1899-12-31',
1,
NULL,N'Madison Square',N'Flatiron District',
40.742164,-73.989894,
N'',N'["politics", "power"]',N'["Thomas C. Platt"]',
N'Republican boss Thomas C. Platt dispensed patronage from the hotel’s famed ‘Amen Corner’.',N'In the 1890s the Fifth Avenue Hotel’s corridor nicknamed ‘Amen Corner’ served as a hub of GOP power-brokering, where projects awaited Platt’s ‘amen’ before moving forward.',N'[{"title": "Fifth Avenue Hotel \u2014 Amen Corner", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Fifth_Avenue_Hotel"}, {"title": "The Fifth Avenue Hotel: Opulence, glamour and power", "publisher": "Bowery Boys History", "url": "https://www.boweryboyshistory.com/2022/09/fifth-avenue-hotel-opulence-atop.html"}]',N'[]');
INSERT INTO nycx.events
(id,title,start_date,end_date,is_approximate,borough,neighborhood,area,lat,lng,bbl,categories_json,people_json,summary,description,sources_json,images_json)
VALUES (N'flat-23-skidoo-circa-1902',N'‘23 Skidoo’ and the Flatiron Corner',
N'1902-01-01',N'1909-12-31',
1,
NULL,N'Flatiron Building',N'Flatiron District',
40.741112,-73.989723,
N'',N'["slang", "culture", "myth"]',N'[]',
N'Popular lore links the phrase ‘23 skidoo’ to police shooing gawkers near the windy Flatiron corner.',N'While the phrase’s true origin is uncertain, one enduring story ties it to the Flatiron Building, where gusts reputedly lifted skirts and police told loiterers to ‘23 skidoo’.',N'[{"title": "23 skidoo \u2014 Origin and usage", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/23_skidoo"}]',N'[]');
