-- nycx_events_seed.sql

-- Wall Street Bombing @ 23 Wall Street
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1920-WALLBOMB', 'Wall Street Bombing', '1920-09-16', 1920, 'true-crime', '["\u2014"]',
        '23 Wall Street', '23 Wall St, New York, NY', '1000260014', 40.70739, -74.01086,
        3, '["crime", "politics", "finance"]', 'A noonday horse-drawn bomb killed 38 and injured hundreds outside the NYSE, shaking Wall Street and the nation.', 'NYT archive summaries; Wikipedia; LPC NYSE');

-- Triangle Shirtwaist Factory Fire @ Brown Building (Asch)
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1911-TRIANGLE', 'Triangle Shirtwaist Factory Fire', '1911-03-25', 1911, 'labor,disaster', '["146 workers; Frances Perkins"]',
        'Brown Building (Asch)', '23-29 Washington Pl', NULL, 40.73012, -73.99558,
        3, '["labor", "women''s-rights", "fire-safety"]', 'A garment-factory fire killed 146; outrage led to sweeping workplace-safety reforms.', 'Cornell Kheel Center; NYS; Wikipedia');

-- Abraham Lincoln's Cooper Union Address @ Cooper Union Great Hall
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1860-LINCOLN', 'Abraham Lincoln''s Cooper Union Address', '1860-02-27', 1860, 'politics', '["Abraham Lincoln"]',
        'Cooper Union Great Hall', '7 E 7th St', '1004650001', 40.72912, -73.99041,
        3, '["politics", "civil-war", "speeches"]', 'Lincoln''s meticulously argued address helped propel him to the Republican nomination.', 'NPS; Abraham Lincoln Online; Gilder Lehrman');

-- Stonewall Uprising @ Stonewall Inn
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1969-STONEWALL', 'Stonewall Uprising', '1969-06-28', 1969, 'LGBTQ,civil-rights', '["Marsha P. Johnson", "Sylvia Rivera"]',
        'Stonewall Inn', '53 Christopher St', '1006100001', 40.73389, -74.00222,
        3, '["LGBTQ", "protest", "policing"]', 'A police raid sparked nights of resistance that catalyzed the modern LGBTQ rights movement.', 'NPS Stonewall; Wikipedia');

-- The 'Sip-In' at Julius' @ Julius’ Bar
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1966-JULIUS', 'The ''Sip-In'' at Julius''', '1966-04-21', 1966, 'LGBTQ,civil-rights', '["Dick Leitsch", "Mattachine Society"]',
        'Julius’ Bar', '159 W 10th St', NULL, 40.73486, -74.00233,
        2, '["LGBTQ", "activism", "law"]', 'Activists announced they were gay and were refused service—helping end the state''s ban on serving gay patrons.', 'NYC LGBT Historic Sites Project');

-- Warhol’s Exploding Plastic Inevitable at The Dom @ The Dom / Polish National Home
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1967-WARHOL-DOM', 'Warhol’s Exploding Plastic Inevitable at The Dom', '1966-04-01', 1966, 'music,art,film', '["Andy Warhol", "The Velvet Underground", "Nico"]',
        'The Dom / Polish National Home', '23 St. Marks Pl', NULL, 40.72979, -73.98761,
        2, '["avant-garde", "performance", "rock"]', 'Warhol fused film, lights, and the Velvet Underground in multimedia happenings on St. Marks Place.', 'Village Preservation; histories');

-- Fillmore East Opens @ Fillmore East
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1968-FILLMORE', 'Fillmore East Opens', '1968-03-08', 1968, 'music', '["Bill Graham; Jimi Hendrix; Grateful Dead; Allman Brothers"]',
        'Fillmore East', '105 Second Ave', '1004500058', 40.7276, -73.9886,
        2, '["rock", "concerts", "venues"]', 'Bill Graham’s ‘Church of Rock and Roll’ ignited the East Village music scene.', 'Wikipedia Fillmore East');

-- The Ramones’ Early CBGB Sets @ CBGB
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1974-CBGB-RAMONES', 'The Ramones’ Early CBGB Sets', '1974-08-16', 1974, 'music', '["Ramones"]',
        'CBGB', '315 Bowery', '1004480001', 40.72574, -73.99255,
        2, '["punk", "cbgb", "bowery"]', 'Fast, loud, and minimalist—Ramones sets helped define NYC punk at CBGB.', 'Wikipedia; histories');

-- Tompkins Square Park Riot @ Tompkins Square Park
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1988-TSP-RIOT', 'Tompkins Square Park Riot', '1988-08-06', 1988, 'protest,policing', '["NYPD; East Village residents"]',
        'Tompkins Square Park', 'E 10th St & Ave A', NULL, 40.72687, -73.98191,
        2, '["gentrification", "curfew", "police-brutality"]', 'A protest against a new curfew escalated into a violent night-long clash; 38 injured.', 'NYT; Wikipedia; Village Preservation');

-- Tompkins Square Unemployment Riot @ Tompkins Square Park
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1874-TSP-RIOT', 'Tompkins Square Unemployment Riot', '1874-01-13', 1874, 'labor,protest', '["Workingmen''s organizations; NYPD"]',
        'Tompkins Square Park', 'E 10th St & Ave A', NULL, 40.72687, -73.98191,
        2, '["labor", "panic-of-1873", "policing"]', 'Police charged thousands of unemployed workers after a permit was revoked.', 'NYT archive; Wikipedia');

-- Murder of 'Crazy Joe' Gallo @ Umberto’s Clam House (original)
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1972-GALLO', 'Murder of ''Crazy Joe'' Gallo', '1972-04-07', 1972, 'true-crime', '["Joe Gallo"]',
        'Umberto’s Clam House (original)', '129 Mulberry St', NULL, 40.71962, -73.9973,
        2, '["mafia", "organized-crime", "little-italy"]', 'Colombo family capo Joe Gallo was shot dead during a late-night birthday meal.', 'NYT; CultureNOW; histories');

-- Cafe Society Opens (Integrated Nightclub) @ Cafe Society (Sheridan Square)
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1935-CAFE-SOCIETY', 'Cafe Society Opens (Integrated Nightclub)', '1938-12-??', 1938, 'music,civil-rights', '["Barney Josephson; Billie Holiday"]',
        'Cafe Society (Sheridan Square)', '1 Sheridan Sq', NULL, 40.73304, -74.00272,
        2, '["jazz", "anti-racism", "nightlife"]', 'The first racially integrated nightclub in NYC helped launch Billie Holiday’s ''Strange Fruit.''', 'Histories; Village Preservation');

-- Washington Square Park Folk 'Riot' @ Washington Square Park Arch
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1961-WSP-FOLK', 'Washington Square Park Folk ''Riot''', '1961-04-09', 1961, 'music,protest', '["Folk singers; NYPD"]',
        'Washington Square Park Arch', 'Washington Sq N & 5th Ave', NULL, 40.73136, -73.99702,
        1, '["folk-revival", "free-speech"]', 'Police crackdown on guitarists and singers spurred a famous free-speech showdown.', 'Village Preservation; NYT');

-- Bob Dylan’s First NYC Sets @ Café Wha?
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1961-DYLAN', 'Bob Dylan’s First NYC Sets', '1961-01-24', 1961, 'music', '["Bob Dylan"]',
        'Café Wha?', '115 MacDougal St', NULL, 40.73005, -74.00078,
        2, '["folk", "greenwich-village"]', 'A 19-year-old Dylan played Café Wha?, soon becoming a Village fixture.', 'Café Wha? histories');

-- First NYC Pride March (Christopher Street Liberation Day) @ Route start near Stonewall
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1970-PRIDE', 'First NYC Pride March (Christopher Street Liberation Day)', '1970-06-28', 1970, 'LGBTQ,civil-rights', '["March organizers; participants"]',
        'Route start near Stonewall', 'Christopher St & 7th Ave S', NULL, 40.7337, -74.0036,
        3, '["pride", "activism", "parade"]', 'On the first anniversary of Stonewall, thousands marched from the Village to Central Park.', 'NYC LGBT Historical sources');

-- ACT UP Wall Street Action @ New York Stock Exchange
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1987-ACTUP-NYSE', 'ACT UP Wall Street Action', '1987-03-24', 1987, 'LGBTQ,health,protest', '["ACT UP"]',
        'New York Stock Exchange', '11 Wall St', '1000260014', 40.70757, -74.01137,
        2, '["aids", "drug-prices", "activism"]', 'ACT UP protested at the NYSE to force down the price of AZT; dozens arrested.', 'ACT UP histories; media coverage');

-- Arch Conspirators 'Seize' Washington Square Arch @ Washington Square Arch
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1917-ARCH-REPUBLIC', 'Arch Conspirators ''Seize'' Washington Square Arch', '1917-01-23', 1917, 'art,performance', '["Marcel Duchamp", "John Sloan"]',
        'Washington Square Arch', 'Washington Sq N & 5th Ave', NULL, 40.73136, -73.99702,
        1, '["dada", "bohemia", "stunt"]', 'Artists climbed the Arch and ''proclaimed'' the Free and Independent Republic of Greenwich Village.', 'Art histories; Village lore');

-- Club 57 Scene on St. Marks @ Club 57
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1978-CLUB57', 'Club 57 Scene on St. Marks', '1978-01-01', 1978, 'art,performance', '["Keith Haring", "Ann Magnuson", "Klaus Nomi"]',
        'Club 57', '57 St. Marks Pl', NULL, 40.7288, -73.9858,
        1, '["underground", "performance", "art"]', 'A crucible for downtown performance art and New Wave.', 'MoMA; oral histories');

-- Paradise Garage Opens @ Paradise Garage
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1977-PGARAGE', 'Paradise Garage Opens', '1977-01-01', 1977, 'music,LGBTQ', '["Larry Levan"]',
        'Paradise Garage', '84 King St', NULL, 40.72625, -74.0046,
        2, '["disco", "dance", "club-culture"]', 'Legendary dance temple shaped house music and gay nightlife.', 'Dance music histories');

-- Nuyorican Poets Cafe Revives @ Nuyorican Poets Cafe
INSERT INTO events (event_id, title, happened_on, era, category, people, place_name, address, bbl, lat, lng, power, interest_tags, blurb, sources)
VALUES ('EVT-1992-Nuyorican', 'Nuyorican Poets Cafe Revives', '1992-01-01', 1992, 'literature,performance', '["Miguel Algar\u00edn", "Miguel Pi\u00f1ero (founders earlier)"]',
        'Nuyorican Poets Cafe', '236 E 3rd St', NULL, 40.72167, -73.97973,
        1, '["poetry", "spoken-word", "latinx"]', 'LES hub for spoken word and performance returns as a cultural anchor.', 'Nuyorican sources');
