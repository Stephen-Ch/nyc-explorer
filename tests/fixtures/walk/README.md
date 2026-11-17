# Walk fixtures (plan 41 slice 1b step 2)

Made by a one-off script (local metres around 40.7359, -73.9906, turned into lat/lng, 6 decimals).
Not real streets or places.

Grid: avenues at x = -200, 0, 200 m; streets at y = -150, 0, 150, 300 m; 12 corners, 17 blocks.
Node ids start at 14349754185 (bigger than a C# int, like real OpenStreetMap ids).

Places (x, y in metres):
Astor Hall (-194, -100), Bowery Bank (-208, 220), Cooper Club (-160, 40, 2 stories),
Delmonico Room (-145, 80), Echo Hall (-230, 120), Fable House (-170, 120), Grange Inn (-190, 120.5),
Hudson Hotel (150, 7), Irving Place Inn (50, -30), Jumel House (0, 0), Knickerbocker (195, 260),
Lafayette Hall (240, 200).

Expected walks (near = 50 m):
1. Astor -> Bowery, up avenue x=-200: Cooper 40 m; Grange, Echo, Fable level at y=120 (within 1 m),
   so nearer first (Grange 10 m), then Echo and Fable (both 30 m) by name. Delmonico 55 m: not listed.
2. Astor -> Hudson, north to y=0 then east (450 m, only shortest): Cooper 40 m off the street,
   Jumel on the corner, Irving 30 m.
3. Hudson -> Knickerbocker, east to x=200 then north (310 m): Lafayette 40 m.
