package com.nextera.one.openlogs.sdk;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenLogsChainServiceTest {

  @Test
  void createsHashChainedRecords() {
    OpenLogsChainService service = new OpenLogsChainService();

    OpenLogsRecord first = service.log(new OpenLogsEntry(
        "system:test",
        "tps://node:test@T:unix.1700000000",
        "http.request.success",
        Map.of("statusCode", 200),
        Map.of("status", "200")
    ));

    OpenLogsRecord second = service.log(new OpenLogsEntry(
        "system:test",
        "tps://node:test@T:unix.1700000010",
        "http.request.success",
        Map.of("statusCode", 201),
        Map.of("status", "201")
    ));

    assertNull(first.getPrev());
    assertEquals(first.getHash(), second.getPrev());
    assertEquals(second.getHash(), service.getLatestHash());
    assertTrue(service.verifyChain());
  }

  @Test
  void returnsImmutableChainSnapshot() {
    OpenLogsChainService service = new OpenLogsChainService();

    service.log(new OpenLogsEntry(
        "system:test",
        "tps://node:test@T:unix.1700000000",
        "custom.event",
        Map.of(),
        Map.of()
    ));

    var chain = service.getChain();
    assertEquals(1, chain.size());
    assertNotNull(chain.get(0).getHash());
  }

  @Test
  void detectsTamperedRecord() {
    OpenLogsEntry entry = new OpenLogsEntry(
        "system:test",
        "tps://node:test@T:unix.1700000000",
        "event",
        Map.of(),
        Map.of()
    );

    String original = OpenLogsChainService.computeHash("openlogs.v2", "id-1", entry, null);
    String tampered = OpenLogsChainService.computeHash("openlogs.v2", "id-2", entry, null);

    assertFalse(original.equals(tampered));
  }

  @Test
  void signsAndVerifiesRecords() {
    OpenLogsChainService service = new OpenLogsChainService();
    OpenLogsKeyPair keys = OpenLogsSigner.generateKeyPair();

    OpenLogsRecord record = service.logSigned(
        new OpenLogsEntry(
            "system:test",
            "tps://node:test@T:unix.1700000000",
            "http.request.success",
            Map.of("statusCode", 200),
            Map.of("status", "200")
        ),
        keys.getPrivateKey(),
        keys.getPublicKey(),
        "k1"
    );

    assertNotNull(record.getSignature());
    assertEquals("Ed25519", record.getSignature().getAlg());
    assertTrue(service.verifySignatures(keys.getPublicKey()));
  }

  @Test
  void rejectsSignatureWithWrongKey() {
    OpenLogsChainService service = new OpenLogsChainService();
    OpenLogsKeyPair keys1 = OpenLogsSigner.generateKeyPair();
    OpenLogsKeyPair keys2 = OpenLogsSigner.generateKeyPair();

    service.logSigned(
        new OpenLogsEntry(
            "system:test",
            "tps://node:test@T:unix.1700000000",
            "event",
            Map.of(),
            Map.of()
        ),
        keys1.getPrivateKey(),
        keys1.getPublicKey(),
        "k1"
    );

    assertFalse(service.verifySignatures(keys2.getPublicKey()));
  }
}
