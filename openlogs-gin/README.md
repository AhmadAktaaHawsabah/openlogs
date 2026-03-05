# openlogs-gin

Gin integration for OpenLogs, modeled after the FastAPI and Spring Boot integrations.

## Features

- Auto-registers Gin middleware for request logging
- Logs success and failure requests into an in-memory OpenLogs chain
- Exposes service access for chain inspection

## Test

```bash
go test ./...
```
