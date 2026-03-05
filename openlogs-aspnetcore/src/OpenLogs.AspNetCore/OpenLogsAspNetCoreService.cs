using OpenLogs.Sdk;

namespace OpenLogs.AspNetCore;

public sealed class OpenLogsAspNetCoreService
{
    private readonly OpenLogsChainService _chain;
    private readonly OpenLogsAspNetCoreOptions _options;

    public OpenLogsAspNetCoreService(OpenLogsChainService chain, OpenLogsAspNetCoreOptions options)
    {
        _chain = chain;
        _options = options;
    }

    public OpenLogsRecord LogHttpRequest(
        string method,
        string path,
        int statusCode,
        long durationMs,
        string clientIp,
        string userAgent,
        string? error,
        string? serverHost
    )
    {
        var actor = string.IsNullOrWhiteSpace(_options.Actor) ? $"client:{clientIp}" : _options.Actor;
        var ev = string.IsNullOrWhiteSpace(error) && statusCode < 500
            ? "http.request.success"
            : "http.request.failed";

        var data = new Dictionary<string, object?>
        {
            ["method"] = method,
            ["url"] = path,
            ["statusCode"] = statusCode,
            ["durationMs"] = durationMs,
            ["userAgent"] = string.IsNullOrWhiteSpace(userAgent) ? "unknown" : userAgent,
        };
        if (!string.IsNullOrWhiteSpace(error))
        {
            data["error"] = error;
        }

        var indexes = new Dictionary<string, string>
        {
            ["method"] = method,
            ["status"] = statusCode.ToString(),
        };

        var entry = new OpenLogsEntry(
            Actor: actor!,
            Tps: BuildTpsUri(serverHost),
            Event: ev,
            Data: data,
            Indexes: indexes
        );

        return _chain.Log(entry);
    }

    public IReadOnlyList<OpenLogsRecord> GetChain() => _chain.GetChain();

    public string? GetLatestHash() => _chain.GetLatestHash();

    private string BuildTpsUri(string? serverHost)
    {
        var locationParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(_options.NodeName))
        {
            locationParts.Add($"node:{_options.NodeName}");
        }
        else if (!string.IsNullOrWhiteSpace(serverHost))
        {
            locationParts.Add($"node:{serverHost}");
        }

        if (_options.Location.Latitude.HasValue && _options.Location.Longitude.HasValue)
        {
            locationParts.Add($"L:{_options.Location.Latitude.Value},{_options.Location.Longitude.Value}");

            var placeParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(_options.Location.PlaceCountryCode))
            {
                placeParts.Add($"cc={_options.Location.PlaceCountryCode}");
            }
            if (!string.IsNullOrWhiteSpace(_options.Location.PlaceCityCode))
            {
                placeParts.Add($"ci={_options.Location.PlaceCityCode}");
            }
            if (placeParts.Count > 0)
            {
                locationParts.Add($"P:{string.Join(',', placeParts)}");
            }
        }

        var location = locationParts.Count == 0 ? "unknown" : string.Join(';', locationParts);
        var contextFragment = "";
        if (_options.Context.Count > 0)
        {
            contextFragment = "#C:" + string.Join(';', _options.Context.Select(kv => $"{kv.Key}={kv.Value}"));
        }

        var unix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return $"tps://{location}@T:unix.{unix}{contextFragment}";
    }
}
