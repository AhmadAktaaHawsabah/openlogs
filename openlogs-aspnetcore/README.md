# openlogs-aspnetcore

ASP.NET Core integration for OpenLogs, modeled after FastAPI and Spring Boot integrations.

## Features

- Auto-registers request middleware for OpenLogs records
- Logs success and failure requests into an in-memory OpenLogs chain
- Exposes `OpenLogsAspNetCoreService` for chain access

## Test

```bash
dotnet test
```
