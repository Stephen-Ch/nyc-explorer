var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => Results.Content(
    """
    <html><head><title>NYC Explorer</title></head><body><h1>NYC Explorer</h1></body></html>
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
