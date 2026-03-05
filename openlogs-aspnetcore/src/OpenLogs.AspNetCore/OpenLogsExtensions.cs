using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using OpenLogs.Sdk;

namespace OpenLogs.AspNetCore;

public static class OpenLogsExtensions
{
    public static IServiceCollection AddOpenLogs(
        this IServiceCollection services,
        Action<OpenLogsAspNetCoreOptions>? configure = null
    )
    {
        var options = new OpenLogsAspNetCoreOptions();
        configure?.Invoke(options);

        services.AddSingleton(options);
        services.AddSingleton<OpenLogsChainService>();
        services.AddSingleton<OpenLogsAspNetCoreService>();
        return services;
    }

    public static IApplicationBuilder UseOpenLogs(this IApplicationBuilder app)
    {
        return app.UseMiddleware<OpenLogsMiddleware>();
    }
}
