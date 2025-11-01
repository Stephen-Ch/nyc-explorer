var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var app = builder.Build();

app.UseStaticFiles();

app.MapGet("/", () => Results.Content(
    """
    <html>
    <head>
      <title>NYC Explorer</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        /* explicit, accessible focus ring for overlay marker buttons */
        [data-testid="poi-marker"]:focus-visible {
          outline: 2px solid #222;
          outline-offset: 2px;
        }
      </style>
    </head>
    <body>
      <h1>NYC Explorer</h1>
      <div id="map-wrap" style="position:relative;"><div id="map" style="height:300px;"></div><div id="poi-overlay" style="position:absolute; inset:0; z-index:650; pointer-events:none;"></div></div>
      <input id="search-input" data-testid="search-input" placeholder="Search POIs…" />
      <ul id="poi-list"></ul>
      <ol id="route-steps"></ol>
      <script src="/js/home.js"></script>
    </body>
    </html>
    """,
    "text/html"));

app.MapGet("/content/poi.v1.json", async () =>
{
    var contentRoot = app.Environment.ContentRootPath;
    var filePath = Path.Combine(contentRoot, "..", "..", "content", "poi.v1.json");

    if (!File.Exists(filePath))
    {
        return Results.NotFound(new { error = "content/poi.v1.json not found" });
    }

    var json = await File.ReadAllTextAsync(filePath);
    return Results.Text(json, "application/json");
});

app.MapControllers();

app.Run("http://localhost:5000");
