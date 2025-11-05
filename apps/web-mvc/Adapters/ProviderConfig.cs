using System;
using Microsoft.Extensions.Configuration;

namespace NYCExplorer.Adapters;

public sealed record ProviderConfig(
    string GeoProvider,
    string RouteProvider,
    bool GeoMockEnabled,
    bool RouteMockEnabled,
    int GeoTimeoutMs,
    int RouteTimeoutMs,
    int AppPort)
{
    public static ProviderConfig FromConfiguration(IConfiguration configuration)
    {
        if (configuration is null)
        {
            throw new ArgumentNullException(nameof(configuration));
        }

        var geoProvider = NormalizeProvider(configuration["GEO_PROVIDER"], "mock");
        var routeProvider = NormalizeProvider(configuration["ROUTE_PROVIDER"], "mock");
        var geoTimeout = ParsePositiveInt(configuration["GEO_TIMEOUT_MS"], 3200);
        var routeTimeout = ParsePositiveInt(configuration["ROUTE_TIMEOUT_MS"], 3200);

        return new ProviderConfig(
            geoProvider,
            routeProvider,
            IsMock(geoProvider),
            IsMock(routeProvider),
            geoTimeout,
            routeTimeout,
            ParsePort(configuration["APP_PORT"], 5000));
    }

    private static string NormalizeProvider(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static int ParsePositiveInt(string? value, int fallback) =>
        int.TryParse(value, out var parsed) && parsed > 0 ? parsed : fallback;

    private static bool IsMock(string provider) =>
        string.Equals(provider, "mock", StringComparison.OrdinalIgnoreCase);

    private static int ParsePort(string? value, int fallback) =>
        int.TryParse(value, out var parsed) && parsed > 0 ? parsed : fallback;
}
