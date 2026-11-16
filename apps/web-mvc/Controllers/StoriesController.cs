using System.IO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NYCExplorer;

namespace NYCExplorer.Controllers;

public class StoriesController : Controller
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<StoriesController> _logger;

    public StoriesController(IWebHostEnvironment environment, ILogger<StoriesController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpGet("/content/stories.v1.json")]
    public async Task<IActionResult> GetStories()
    {
        const string action = "stories.file";
        var filePath = ContentPathHelper.GetStoriesFilePath(_environment);

        if (!System.IO.File.Exists(filePath))
        {
            _logger.LogError("Stories data file missing {Action} {Path}", action, filePath);
            return NotFound(new { error = "content/stories.v1.json not found" });
        }

        try
        {
            var json = await System.IO.File.ReadAllTextAsync(filePath);
            return Content(json, "application/json");
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "Stories file read failed {Action} {Path}", action, filePath);
            return StatusCode(500);
        }
    }
}
