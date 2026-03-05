using OpenLogs.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenLogs(options =>
{
    options.NodeName = "demo-api";
    options.Context["env"] = "demo";
    options.Location.Latitude = 25.2048;
    options.Location.Longitude = 55.2708;
    options.Location.PlaceCountryCode = "AE";
});

var app = builder.Build();
app.UseOpenLogs();

app.MapGet("/", () => "Hello OpenLogs API!");

app.MapGet("/error", () =>
{
    throw new InvalidOperationException("Something went wrong!");
});

app.MapGet("/chain", (OpenLogsAspNetCoreService service) =>
    service.GetChain().Select(r => new
    {
        id = r.Id,
        hash = r.Hash,
        @event = r.Entry.Event,
        tps = r.Entry.Tps,
    })
);

app.Run();
