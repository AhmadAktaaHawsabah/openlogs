namespace OpenLogs.AspNetCore;

public sealed class OpenLogsAspNetCoreOptions
{
    public bool Enabled { get; set; } = true;
    public string? Actor { get; set; }
    public string? NodeName { get; set; }
    public Dictionary<string, string> Context { get; set; } = new();
    public OpenLogsLocationOptions Location { get; set; } = new();
}

public sealed class OpenLogsLocationOptions
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? PlaceCountryCode { get; set; }
    public string? PlaceCityCode { get; set; }
}
