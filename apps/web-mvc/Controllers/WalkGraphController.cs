using System.IO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NYCExplorer;

namespace NYCExplorer.Controllers;

public class WalkGraphController : Controller
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<WalkGraphController> _logger;

    public WalkGraphController(IWebHostEnvironment environment, ILogger<WalkGraphController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpGet("/content/walk-graph.v1.json")]
    public async Task<IActionResult> GetWalkGraph()
    {
        const string action = "walk-graph.file";
        var filePath = ContentPathHelper.GetWalkGraphFilePath(_environment);

        if (!System.IO.File.Exists(filePath))
        {
            _logger.LogError("Walk graph data file missing {Action} {Path}", action, filePath);
            return NotFound(new { error = "content/walk-graph.v1.json not found" });
        }

        try
        {
            var json = await System.IO.File.ReadAllTextAsync(filePath);
            return Content(json, "application/json");
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "Walk graph file read failed {Action} {Path}", action, filePath);
            return StatusCode(500);
        }
    }
}
