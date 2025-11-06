using Microsoft.AspNetCore.Mvc;

namespace NYCExplorer.Controllers;

public sealed class HomeController : Controller
{
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }
}
