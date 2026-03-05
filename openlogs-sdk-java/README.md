# openlogs-sdk-java

Core Java SDK for OpenLogs v2 style hash-chained records.

## Features

- Create tamper-evident log records linked by SHA-256 previous hashes
- Deterministic canonical JSON hashing
- In-memory chain service with integrity verification
- Ed25519 signing and signature verification helpers

## Build and Test

```bash
mvn test
```

## Quick Example

```java
OpenLogsChainService service = new OpenLogsChainService();

OpenLogsEntry entry = new OpenLogsEntry(
    "system:api",
    "tps://node:api@T:unix.1700000000",
    "http.request.success",
    Map.of("method", "GET", "statusCode", 200),
    Map.of("method", "GET", "status", "200")
);

OpenLogsRecord record = service.log(entry);
System.out.println(record.getHash());

OpenLogsKeyPair keys = OpenLogsSigner.generateKeyPair();
OpenLogsRecord signed = service.logSigned(
    entry,
    keys.getPrivateKey(),
    keys.getPublicKey(),
    "k1"
);

boolean signaturesOk = service.verifySignatures(keys.getPublicKey());
System.out.println(signaturesOk);
```
