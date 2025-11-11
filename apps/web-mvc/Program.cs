using System.Text.Json;
using NYCExplorer;
using NYCExplorer.Adapters;
using NYCExplorer.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var providerConfig = ProviderConfig.FromConfiguration(builder.Configuration);
var providerConfigJson = JsonSerializer.Serialize(new
{
  geoProvider = providerConfig.GeoProvider,
  routeProvider = providerConfig.RouteProvider,
  geoMock = providerConfig.GeoMockEnabled,
  routeMock = providerConfig.RouteMockEnabled,
  geoTimeoutMs = providerConfig.GeoTimeoutMs,
  routeTimeoutMs = providerConfig.RouteTimeoutMs,
  appPort = providerConfig.AppPort,
});

HomeHtmlProvider.Configure(providerConfigJson);

var app = builder.Build();

app.UseStaticFiles();
app.MapGet("/js/dir-ui.js", async context =>
{
  var file = app.Environment.WebRootFileProvider.GetFileInfo("js/directions.js");
  context.Response.ContentType = "text/javascript";
  await context.Response.SendFileAsync(file);
});
app.Use(async (context, next) =>
{
  await next();
  var contentType = context.Response.ContentType;
  if (!string.IsNullOrEmpty(contentType) && contentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) && !contentType.Contains("charset", StringComparison.OrdinalIgnoreCase))
  {
    context.Response.ContentType = "text/html; charset=utf-8";
  }
});

app.MapGet("/", static async context =>
{
  context.Response.ContentType = "text/html; charset=utf-8";
  await context.Response.WriteAsync(HomeHtmlProvider.GetHtml());
});

app.MapGet("/content/poi.v1.json", async () =>
{
    var filePath = ContentPathHelper.GetPoiFilePath(app.Environment, string.Empty);

    if (!File.Exists(filePath))
    {
        return Results.NotFound(new { error = "content/poi.v1.json not found" });
    }

    var json = await File.ReadAllTextAsync(filePath);
    return Results.Text(json, "application/json");
});

app.MapControllerRoute(
  name: "view-home",
  pattern: "__view-home",
  defaults: new { controller = "Home", action = "HomeShadow" });

app.MapControllerRoute(
  name: "view-ok",
  pattern: "__view-ok",
  defaults: new { controller = "Home", action = "Index" });

app.MapControllers();

app.Run();

internal static class HomeHtmlProvider
{
    private static string _html = string.Empty;

    public static void Configure(string appConfigJson)
    {
    var configJson = string.IsNullOrEmpty(appConfigJson) ? "{}" : appConfigJson;
    var messagesJson = JsonSerializer.Serialize(new
    {
      locating = ErrorMessages.Locating,
      usingCurrentLocation = ErrorMessages.UsingCurrentLocation,
      locationUnavailable = ErrorMessages.LocationUnavailable,
    });
    
    var orFlag = Environment.GetEnvironmentVariable("OVERLAY_RECOVERY");
    var overlayOff = orFlag == "0"; // default ON unless explicitly "0"
    
    _html = HomeHtmlCore.ProcessTemplate(HtmlTemplate, configJson, messagesJson, overlayEnabled: !overlayOff);
    }

    public static string GetHtml()
    {
    if (string.IsNullOrEmpty(_html))
    {
      var html = HtmlTemplate
        .Replace("__APP_CONFIG__", "{}")
        .Replace("__ERROR_MESSAGES__", JsonSerializer.Serialize(new
        {
          locating = ErrorMessages.Locating,
          usingCurrentLocation = ErrorMessages.UsingCurrentLocation,
          locationUnavailable = ErrorMessages.LocationUnavailable,
        }));
      _html = HomeHtmlCore.InjectEnvScript(html, "{}");
    }

    return _html;
    }

  private const string HtmlTemplate = $$"""
    <html>
    <head>
      <meta charset="utf-8">
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
      <div id="route-inputs" style="margin-bottom:1rem; display:flex; gap:0.5rem; align-items:flex-end;">
        <label for="route-from" style="display:block; font-weight:600;">From</label>
        <input id="route-from" data-testid="route-from" placeholder="From…" />
        <label for="route-to" style="display:block; font-weight:600;">To</label>
        <input id="route-to" data-testid="route-to" placeholder="To…" />
        <button data-testid="route-find">Find Route</button>
        <button type="button" data-testid="share-link" aria-disabled="true" disabled>Copy link</button>
      </div>
      <div id="geo-typeahead" style="margin-bottom:1rem; max-width:320px;">
        <label for="geo-from">Starting point (typeahead)</label>
        <input id="geo-from" data-testid="geo-from" autocomplete="off" placeholder="Search for a starting point…" role="combobox" aria-expanded="false" aria-controls="geo-from-list" aria-autocomplete="list" />
    <button type="button" data-testid="geo-current" data-target="from" aria-label="Use current location" style="margin-top:4px;">Current</button>
        <div id="geo-from-list" data-testid="ta-list" role="listbox" style="display:none; border:1px solid #ccc; background:#fff; margin-top:4px; box-shadow:0 2px 6px rgba(0,0,0,0.1);"></div>
        <div data-testid="geo-status" aria-live="polite" style="margin-top:4px; min-height:1em;"></div>
      </div>
      <div id="geo-to-typeahead" style="margin-bottom:1rem; max-width:320px;">
        <label for="geo-to">Destination (typeahead)</label>
        <input id="geo-to" data-testid="geo-to" autocomplete="off" placeholder="Search for a destination…" role="combobox" aria-expanded="false" aria-controls="geo-to-list" aria-autocomplete="list" />
        <button type="button" data-testid="geo-current" data-target="to" aria-label="Use current location" style="margin-top:4px;">Current</button>
        <div id="geo-to-list" role="listbox" style="display:none; border:1px solid #ccc; background:#fff; margin-top:4px; box-shadow:0 2px 6px rgba(0,0,0,0.1);"></div>
      </div>
      <div id="map-wrap" style="position:relative;"><div id="map" style="height:300px;"></div><div id="poi-overlay" style="position:absolute; inset:0; z-index:650; pointer-events:none;"></div></div>
      <label for="search-input" style="display:block; font-weight:600;">Search</label>
      <input id="search-input" data-testid="search-input" placeholder="Search POIs…" />
    <div data-testid="poi-error" aria-live="polite"></div>
    <ul id="poi-list" data-testid="poi-list"></ul>
    <div id="route-msg" data-testid="route-msg" aria-live="polite"></div>
    <div data-testid="dir-status" aria-live="polite"></div>
    <ol data-testid="turn-list"></ol>
    <ol id="route-steps"></ol>
    <script src="/js/typeahead-helpers.js"></script>
    <script src="/js/geo-typeahead.js"></script>
    <script src="/js/poi-fetch-guard.js"></script>
    <script id="nyc-error-messages" type="application/json">__ERROR_MESSAGES__</script>
    <script src="/js/home.js"></script>
    <script src="/js/app-bootstrap.js"></script>
    <script src="/js/adapters.js"></script>
    <script src="/js/directions.js" type="application/json"></script>
    <script src="/js/dir-ui.js"></script>
    <script src="/js/marker-sanitizer.js"></script>
    <script src="/js/nav-bootstrap.js"></script>
    </body>
    </html>
    """;
}

