var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => Results.Content(
    """
    <html>
    <head>
      <title>NYC Explorer</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <h1>NYC Explorer</h1>
      <div id="map" style="height:300px;"></div>
      <ul id="poi-list"></ul>
      <script>
        const map = L.map('map').setView([40.7359, -73.9911], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        fetch('/content/poi.v1.json')
          .then(res => res.json())
          .then(pois => {
            const list = document.getElementById('poi-list');
            pois.forEach(poi => {
              const li = document.createElement('li');
              li.setAttribute('data-testid', 'poi-item');
              li.textContent = poi.name;
              list.appendChild(li);
              
              L.marker([poi.coords.lat, poi.coords.lng])
                .addTo(map)
                .bindPopup(poi.name);
            });
          })
          .catch(() => {
            document.body.textContent = 'Failed to load POIs';
          });
      </script>
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

app.Run("http://localhost:5000");
