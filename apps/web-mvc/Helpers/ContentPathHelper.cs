namespace NYCExplorer.Helpers;

/// <summary>
/// Helper class for constructing file paths in the content directory
/// Eliminates duplication of relative path logic
/// </summary>
public static class ContentPathHelper
{
    private const string ContentFolderName = "content";
    private const string PoiFileName = "poi.v1.json";
    
    /// <summary>
    /// Gets the full path to the POI data file
    /// </summary>
    /// <param name="contentRootPath">The content root path from IWebHostEnvironment</param>
    /// <returns>Full path to poi.v1.json</returns>
    public static string GetPoiFilePath(string contentRootPath)
    {
        return Path.Combine(contentRootPath, "..", "..", ContentFolderName, PoiFileName);
    }
}
