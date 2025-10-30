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
      <input id="search-input" data-testid="search-input" placeholder="Search POIs…" />
      <ul id="poi-list"></ul>
      <script>
        const map = L.map('map').setView([40.7359, -73.9911], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        let pois = [];

        function render(listData) {
          const list = document.getElementById('poi-list');
          list.innerHTML = '';
          listData.forEach(poi => {
            const li = document.createElement('li');
            li.setAttribute('data-testid', 'poi-item');
            li.textContent = poi.name;
            list.appendChild(li);
          });
        }

        fetch('/content/poi.v1.json')
          .then(res => res.json())
          .then(data => {
            pois = data;
            render(pois);
            
            pois.forEach(poi => {
              L.marker([poi.coords.lat, poi.coords.lng])
                .addTo(map)
                .bindPopup(poi.name);
            });

            document.getElementById('search-input').addEventListener('input', (e) => {
              const q = e.target.value.toLowerCase();
              const filtered = pois.filter(p => p.name.toLowerCase().includes(q));
              render(filtered);
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

app.MapGet("/poi/{id}", async (string id) =>
{
    var contentRoot = app.Environment.ContentRootPath;
    var filePath = Path.Combine(contentRoot, "..", "..", "content", "poi.v1.json");

    if (!File.Exists(filePath))
    {
        return Results.NotFound();
    }

    var json = await File.ReadAllTextAsync(filePath);
    using var doc = System.Text.Json.JsonDocument.Parse(json);
    
    foreach (var element in doc.RootElement.EnumerateArray())
    {
        if (element.TryGetProperty("id", out var poiId) && poiId.GetString() == id)
        {
            var name = element.GetProperty("name").GetString();
            var summary = element.GetProperty("summary").GetString();
            
            var sourcesHtml = "";
            if (element.TryGetProperty("sources", out var sources))
            {
                foreach (var source in sources.EnumerateArray())
                {
                    var title = source.GetProperty("title").GetString();
                    var url = source.GetProperty("url").GetString();
                    var publisher = source.GetProperty("publisher").GetString();
                    sourcesHtml += $"""<li data-testid="poi-source"><a href="{url}">{title}</a> — {publisher}</li>""";
                }
            }
            
            var html = $$"""
                <html>
                <head><title>{{name}} - NYC Explorer</title></head>
                <body>
                  <a data-testid="back-to-map" href="/">← Back to Map</a>
                  <h1 id="poi-title">{{name}}</h1>
                  <p id="poi-summary">{{summary}}</p>
                  <ul id="poi-sources">{{sourcesHtml}}</ul>
                </body>
                </html>
                """;
            return Results.Content(html, "text/html");
        }
    }
    
    return Results.NotFound();
});

app.Run("http://localhost:5000");
