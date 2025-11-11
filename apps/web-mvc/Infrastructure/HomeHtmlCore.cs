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
}
