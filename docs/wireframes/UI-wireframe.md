# NYC EXPLORER Manhattan Walking Route Planner — Wireframes (v0)
Status: Reference for future EPICs (no build in v0.1)
Relates: EPIC-PLANNER (v0.2), EPIC-TIME (v0.3), UI-ROUTE-RESULT (v0.1)
Wireframe 1: Route Input Screen
+------------------------------------------------------+
|  MANHATTAN WALKING ROUTE PLANNER                     |
+------------------------------------------------------+
|                                                      |
|  From: [Empire State Building_____________] 📍       |
|  To:   [Central Park____________________] 📍       |
|                                                      |
|  Year: [2023 ▼]                                      |
|        (1900-2023)                                   |
|                                                      |
|         [      FIND ROUTE      ]                     |
|                                                      |
+------------------------------------------------------+
Description - Input Screen:
Header: Clear title identifying the application
From/To Fields: Text input fields with location autocomplete functionality
Each has a location pin icon (📍) for current location or map selection
Year Selector: Dropdown menu allowing users to select a year (1900-2023)
This unique feature enables historical route planning to see how Manhattan looked in different eras
Find Route Button: Prominent call-to-action button to generate the walking route
Wireframe 2: Route Results Screen - More Accurate Manhattan Rendering
+------------------------------------------------------+
|  MANHATTAN WALKING ROUTE PLANNER                     |
+------------------------------------------------------+
|  Empire State Building → Central Park | 1.8 miles    |
|  Est. walking time: 36 min | Year: 2023             |
+------------------------------------------------------+
|                                                      |
|  B ★ Central Park (59th St)                          |
|  ┌─────────────────────────────────────┐             |
|  │                                     │             |
|  └─────────────────────────────────────┘             |
|    ↑                                                 |
|    │                                                 |
|    │ ★ The Plaza Hotel (59th St)                     |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │ ★ Tiffany & Co. (57th St)                       |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │ ★ New York Public Library (42nd St)             |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|    │                                                 |
|  A ★ Empire State Building (34th St)                 |
|                                                      |
+------------------------------------------------------+
|  [NEW ROUTE]    [SHARE]    [DIRECTIONS]    [SAVE]    |
+------------------------------------------------------+
Description - Results Screen (Revised):
Route Summary: Shows origin and destination, total distance (1.8 miles), and estimated walking time (36 min)
Map View: More geographically accurate ASCII representation of the walking route up 5th Avenue:
A: Starting point - Empire State Building at 34th Street (bottom of map)
B: Destination - Central Park entrance at 59th Street (top of map)
Points of Interest accurately placed along 5th Avenue:
New York Public Library at 42nd Street
Tiffany & Co. at 57th Street
The Plaza Hotel at 59th Street (just before Central Park)
Central Park: Represented with a rectangular outline at the top of the map
Route Path: Clear north-bound path indication with a vertical line and directional arrow showing the walk up 5th Avenue
Street Information: Each landmark includes its street location for better orientation
Action Buttons:
New Route: Return to input screen
Share: Share route with others
Directions: View turn-by-turn walking directions
Save: Save route to favorites
This revised wireframe provides a more geographically accurate representation of the actual walking route from the Empire State Building up 5th Avenue to Central Park, with correctly positioned landmarks along the way. The north-south orientation is preserved with the Empire State Building at the bottom (south) and Central Park at the top (north), matching Manhattan's actual layout.