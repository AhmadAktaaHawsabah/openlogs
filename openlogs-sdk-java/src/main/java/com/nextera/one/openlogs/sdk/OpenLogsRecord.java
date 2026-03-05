package com.nextera.one.openlogs.sdk;

import java.util.Objects;

public class OpenLogsRecord {
  private final String spec;
  private final String id;
  private final OpenLogsEntry entry;
  private final String prev;
  private final String hash;
  private final OpenLogsSignature signature;

  public OpenLogsRecord(String spec, String id, OpenLogsEntry entry, String prev, String hash) {
    this(spec, id, entry, prev, hash, null);
  }

  public OpenLogsRecord(
      String spec,
      String id,
      OpenLogsEntry entry,
      String prev,
      String hash,
      OpenLogsSignature signature
  ) {
    this.spec = Objects.requireNonNull(spec, "spec is required");
    this.id = Objects.requireNonNull(id, "id is required");
    this.entry = Objects.requireNonNull(entry, "entry is required");
    this.prev = prev;
    this.hash = Objects.requireNonNull(hash, "hash is required");
    this.signature = signature;
  }

  public String getSpec() {
    return spec;
  }

  public String getId() {
    return id;
  }

  public OpenLogsEntry getEntry() {
    return entry;
  }

  public String getPrev() {
    return prev;
  }

  public String getHash() {
    return hash;
  }

  public OpenLogsSignature getSignature() {
    return signature;
  }

  public OpenLogsRecord withSignature(OpenLogsSignature nextSignature) {
    return new OpenLogsRecord(spec, id, entry, prev, hash, nextSignature);
  }
}
