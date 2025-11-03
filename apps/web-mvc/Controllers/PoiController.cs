using System.Collections.Generic;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using NYCExplorer.Helpers;

namespace NYCExplorer.Controllers;

[Route("/poi/{id}")]
public class PoiController : Controller
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PoiController> _logger;

    public PoiController(IWebHostEnvironment environment, ILogger<PoiController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Detail(string id)
    {
        try
        {
            var filePath = ContentPathHelper.GetPoiFilePath(_environment.ContentRootPath);
            
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning("POI data file not found at {FilePath}", filePath);
                return NotFound();
            }

            await using var stream = System.IO.File.OpenRead(filePath);
            using var doc = await JsonDocument.ParseAsync(stream);

            foreach (var element in doc.RootElement.EnumerateArray())
            {
                if (element.TryGetProperty("id", out var poiId) && 
                    string.Equals(poiId.GetString(), id, StringComparison.OrdinalIgnoreCase))
                {
                    return View("Detail", BuildModel(element));
                }
            }

            _logger.LogInformation("POI with id {PoiId} not found", id);
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading POI detail for id {PoiId}", id);
            return StatusCode(500);
        }
    }

    private static PoiDetailViewModel BuildModel(JsonElement element)
    {
        var name = element.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? string.Empty : string.Empty;
        var summary = element.TryGetProperty("summary", out var summaryProp) ? summaryProp.GetString() ?? string.Empty : string.Empty;

        var sources = new List<PoiSourceViewModel>();
        if (element.TryGetProperty("sources", out var sourcesElement))
        {
            foreach (var source in sourcesElement.EnumerateArray())
            {
                sources.Add(new PoiSourceViewModel(
                    source.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? string.Empty : string.Empty,
                    source.TryGetProperty("url", out var urlProp) ? urlProp.GetString() ?? string.Empty : string.Empty,
                    source.TryGetProperty("publisher", out var publisherProp) ? publisherProp.GetString() ?? string.Empty : string.Empty));
            }
        }

        var images = new List<PoiImageViewModel>();
        if (element.TryGetProperty("images", out var imagesElement))
        {
            foreach (var image in imagesElement.EnumerateArray())
            {
                if (!image.TryGetProperty("src", out var srcProp))
                {
                    continue;
                }

                var src = srcProp.GetString();
                if (string.IsNullOrWhiteSpace(src))
                {
                    continue;
                }

                var credit = image.TryGetProperty("credit", out var creditProp) ? creditProp.GetString() : null;
                images.Add(new PoiImageViewModel(src!, credit));
            }
        }

        return new PoiDetailViewModel(name, summary, sources, images);
    }

    public record PoiDetailViewModel(string Name, string Summary, IReadOnlyList<PoiSourceViewModel> Sources, IReadOnlyList<PoiImageViewModel> Images);
    public record PoiSourceViewModel(string Title, string Url, string Publisher);
    public record PoiImageViewModel(string Src, string? Credit);
}
