package com.nextera.one.openlogs.sdk;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public class OpenLogsEntry {
  private final String actor;
  private final String tps;
  private final String event;
  private final Map<String, Object> data;
  private final Map<String, String> indexes;

  public OpenLogsEntry(
      String actor,
      String tps,
      String event,
      Map<String, Object> data,
      Map<String, String> indexes
  ) {
    this.actor = Objects.requireNonNull(actor, "actor is required");
    this.tps = Objects.requireNonNull(tps, "tps is required");
    this.event = Objects.requireNonNull(event, "event is required");
    this.data = data == null ? new LinkedHashMap<>() : new LinkedHashMap<>(data);
    this.indexes = indexes == null ? new LinkedHashMap<>() : new LinkedHashMap<>(indexes);
  }

  public String getActor() {
    return actor;
  }

  public String getTps() {
    return tps;
  }

  public String getEvent() {
    return event;
  }

  public Map<String, Object> getData() {
    return new LinkedHashMap<>(data);
  }

  public Map<String, String> getIndexes() {
    return new LinkedHashMap<>(indexes);
  }
}
