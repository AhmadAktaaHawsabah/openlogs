package com.nextera.one.openlogs.sdk;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

public class OpenLogsChainService {
  private static final String SPEC = "openlogs.v2";

  private final List<OpenLogsRecord> records = new ArrayList<>();
  private String latestHash;

  public synchronized OpenLogsRecord log(OpenLogsEntry entry) {
    Objects.requireNonNull(entry, "entry is required");

    String id = UUID.randomUUID().toString();
    String prev = latestHash;

    String hash = computeHash(SPEC, id, entry, prev);
    OpenLogsRecord record = new OpenLogsRecord(SPEC, id, entry, prev, hash);

    records.add(record);
    latestHash = hash;
    return record;
  }

  public synchronized OpenLogsRecord logSigned(
      OpenLogsEntry entry,
      PrivateKey privateKey,
      PublicKey publicKey,
      String kid
  ) {
    OpenLogsRecord unsigned = log(entry);
    OpenLogsRecord signed = OpenLogsSigner.signRecord(unsigned, privateKey, publicKey, kid);

    records.set(records.size() - 1, signed);
    latestHash = signed.getHash();
    return signed;
  }

  public synchronized List<OpenLogsRecord> getChain() {
    return List.copyOf(records);
  }

  public synchronized String getLatestHash() {
    return latestHash;
  }

  public synchronized boolean verifyChain() {
    String expectedPrev = null;
    for (OpenLogsRecord record : records) {
      if (!Objects.equals(record.getPrev(), expectedPrev)) {
        return false;
      }

      String recomputed = computeHash(
          record.getSpec(),
          record.getId(),
          record.getEntry(),
          record.getPrev()
      );

      if (!Objects.equals(recomputed, record.getHash())) {
        return false;
      }

      expectedPrev = record.getHash();
    }
    return true;
  }

  public synchronized boolean verifySignatures(PublicKey publicKey) {
    for (OpenLogsRecord record : records) {
      if (record.getSignature() == null) {
        continue;
      }
      if (!OpenLogsSigner.verifySignature(record, publicKey)) {
        return false;
      }
    }
    return true;
  }

  static String computeHash(String spec, String id, OpenLogsEntry entry, String prev) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("spec", spec);
    payload.put("id", id);
    payload.put("prev", prev);

    Map<String, Object> entryPayload = new LinkedHashMap<>();
    entryPayload.put("actor", entry.getActor());
    entryPayload.put("tps", entry.getTps());
    entryPayload.put("event", entry.getEvent());
    entryPayload.put("data", entry.getData());
    entryPayload.put("indexes", entry.getIndexes());
    payload.put("entry", entryPayload);

    return Hashing.sha256Hex(CanonicalJson.stringify(payload));
  }
}
