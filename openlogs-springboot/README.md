# openlogs-springboot

Spring Boot integration for OpenLogs, modeled after the NestJS package behavior.

## Features

- Auto-registers an HTTP interceptor
- Logs request success and failures into an in-memory OpenLogs chain
- Exposes `OpenLogsSpringService` for chain access and custom logging
- Property-based configuration via `openlogs.*`

## Configuration

```yaml
openlogs:
  enabled: true
  actor: "system:api"
  node-name: "gateway-eu"
  context:
    env: production
    tenant: acme
  location:
    latitude: 48.8566
    longitude: 2.3522
    place-country-code: FR
```

## Build and Test

```bash
mvn test
```
