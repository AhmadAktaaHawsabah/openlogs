using Microsoft.AspNetCore.Http;

namespace OpenLogs.AspNetCore.Tests;

public class OpenLogsMiddlewareTests
{
    [Fact]
    public async Task LogsSuccessRequest()
    {
        var options = new OpenLogsAspNetCoreOptions
        {
            Enabled = true,
            NodeName = "demo-api",
            Context = new Dictionary<string, string> { ["env"] = "test" },
        };
        var chain = new OpenLogs.Sdk.OpenLogsChainService();
        var service = new OpenLogsAspNetCoreService(chain, options);

        var middleware = new OpenLogsMiddleware(async ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            await Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = "/";

        await middleware.InvokeAsync(context, service, options);

        var chainEntries = service.GetChain();
        Assert.Single(chainEntries);
        Assert.Equal("http.request.success", chainEntries[0].Entry.Event);
    }

    [Fact]
    public async Task LogsFailedRequest()
    {
        var options = new OpenLogsAspNetCoreOptions { Enabled = true };
        var chain = new OpenLogs.Sdk.OpenLogsChainService();
        var service = new OpenLogsAspNetCoreService(chain, options);

        var middleware = new OpenLogsMiddleware(_ => throw new InvalidOperationException("boom"));

        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = "/error";

        await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.InvokeAsync(context, service, options));

        var chainEntries = service.GetChain();
        Assert.Single(chainEntries);
        Assert.Equal("http.request.failed", chainEntries[0].Entry.Event);
    }
}
