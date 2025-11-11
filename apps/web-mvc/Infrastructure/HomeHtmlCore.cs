using System;

namespace NYCExplorer;

internal static class HomeHtmlCore
{
  /// <summary>
  /// Injects overlay script tags just before &lt;/body&gt; when enabled; otherwise returns html unchanged.
  /// </summary>
  public static string WithOverlayScripts(string html, bool overlayEnabled)
  {
    if (!overlayEnabled || string.IsNullOrEmpty(html)) return html ?? string.Empty;
    const string needle = "</body>";
    if (html.IndexOf(needle, StringComparison.OrdinalIgnoreCase) < 0) return html;
    const string scripts =
      "<script src=\"/js/_overlay/overlay-core.js\"></script>" +
      "<script src=\"/js/_overlay/overlay-announce.js\"></script>";
    // Replace first occurrence (case-sensitive match is fine because our template uses lowercase)
    return html.Replace(needle, scripts + needle);
  }

  /// <summary>
  /// Injects window.ENV script into &lt;head&gt; with app configuration.
  /// </summary>
  public static string InjectEnvScript(string html, string appConfigJson)
  {
    var script = $"<script id=\"app-env\">window.ENV = {appConfigJson};</script>";
    var idx = html.IndexOf("</head>", StringComparison.OrdinalIgnoreCase);
    if (idx >= 0)
    {
      return html.Insert(idx, script);
    }

    return script + html;
  }

  /// <summary>
  /// Replaces placeholders in the inline template, then injects overlay scripts and ENV.
  /// </summary>
  public static string ProcessTemplate(string template, string configJson, string messagesJson, bool overlayEnabled)
  {
    var html = (template ?? string.Empty)
      .Replace("__APP_CONFIG__", configJson ?? "{}")
      .Replace("__ERROR_MESSAGES__", messagesJson ?? "{}");
    html = WithOverlayScripts(html, overlayEnabled);
    html = InjectEnvScript(html, configJson ?? "{}");
    return html;
  }
}
