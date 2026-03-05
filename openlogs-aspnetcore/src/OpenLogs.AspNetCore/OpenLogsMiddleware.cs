using Microsoft.AspNetCore.Http;

namespace OpenLogs.AspNetCore;

public sealed class OpenLogsMiddleware
{
    private readonly RequestDelegate _next;

    public OpenLogsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, OpenLogsAspNetCoreService service, OpenLogsAspNetCoreOptions options)
    {
        if (!options.Enabled)
        {
            await _next(context);
            return;
        }

        var started = DateTimeOffset.UtcNow;
        string? error = null;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            error = ex.Message;
            throw;
        }
        finally
        {
            var durationMs = Math.Max(0, (long)(DateTimeOffset.UtcNow - started).TotalMilliseconds);
            var statusCode = error is null ? context.Response.StatusCode : 500;

            try
            {
                service.LogHttpRequest(
                    method: context.Request.Method,
                    path: context.Request.Path.ToString(),
                    statusCode: statusCode,
                    durationMs: durationMs,
                    clientIp: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    userAgent: context.Request.Headers.UserAgent.ToString(),
                    error: error,
                    serverHost: context.Request.Host.Host
                );
            }
            catch
            {
                // Telemetry errors should not affect app behavior.
            }
        }
    }
}
