using System;
using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace NYCExplorer;

public static class ContentPathHelper
{
    public static string GetPoiFilePath(IWebHostEnvironment env, string poiId)
    {
        if (env is null)
        {
            throw new ArgumentNullException(nameof(env));
        }

        return Path.Combine(env.ContentRootPath, "..", "..", "content", "poi.v1.json");
    }
}
