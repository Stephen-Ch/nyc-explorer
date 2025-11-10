using Microsoft.AspNetCore.Mvc;

namespace NYCExplorer.Controllers;

public sealed class HomeController : Controller
{
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }

    [HttpGet]
    public IActionResult HomeShadow()
    {
        var html = HomeHtmlProvider.GetHtml();
        return Content(html, "text/html; charset=utf-8");
    }
}
