package com.nextera.one.openlogs.springboot;

import com.nextera.one.openlogs.sdk.OpenLogsChainService;
import com.nextera.one.openlogs.sdk.OpenLogsEntry;
import com.nextera.one.openlogs.sdk.OpenLogsRecord;

import jakarta.servlet.http.HttpServletRequest;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OpenLogsSpringService {
  private final OpenLogsChainService chainService;
  private final OpenLogsProperties properties;

  public OpenLogsSpringService(OpenLogsChainService chainService, OpenLogsProperties properties) {
    this.chainService = chainService;
    this.properties = properties;
  }

  public OpenLogsRecord logHttpRequest(
      HttpServletRequest request,
      int statusCode,
      long durationMs,
      Throwable error
  ) {
    String actor = resolveActor(request);
    String event = error == null ? "http.request.success" : "http.request.failed";

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("method", request.getMethod());
    data.put("url", request.getRequestURI());
    data.put("statusCode", statusCode);
    data.put("durationMs", durationMs);
    data.put("userAgent", request.getHeader("User-Agent") == null ? "unknown" : request.getHeader("User-Agent"));
    if (error != null) {
      data.put("error", error.getMessage());
    }

    Map<String, String> indexes = new LinkedHashMap<>();
    indexes.put("method", request.getMethod());
    indexes.put("status", String.valueOf(statusCode));

    OpenLogsEntry entry = new OpenLogsEntry(actor, buildTpsUri(request), event, data, indexes);
    return chainService.log(entry);
  }

  public List<OpenLogsRecord> getChain() {
    return chainService.getChain();
  }

  public String getLatestHash() {
    return chainService.getLatestHash();
  }

  private String resolveActor(HttpServletRequest request) {
    if (properties.getActor() != null && !properties.getActor().isBlank()) {
      return properties.getActor();
    }

    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (forwardedFor != null && !forwardedFor.isBlank()) {
      return "client:" + forwardedFor.split(",")[0].trim();
    }
    return "client:" + request.getRemoteAddr();
  }

  private String buildTpsUri(HttpServletRequest request) {
    StringBuilder location = new StringBuilder();

    String localIp = request.getLocalAddr();
    if (localIp != null && !localIp.isBlank()) {
      if (localIp.contains(":")) {
        location.append("net:ip6:").append(localIp);
      } else {
        location.append("net:ip4:").append(localIp);
      }
    }

    String nodeName = properties.getNodeName();
    if (nodeName == null || nodeName.isBlank()) {
      nodeName = request.getServerName();
    }
    if (nodeName != null && !nodeName.isBlank()) {
      if (location.length() > 0) {
        location.append(";");
      }
      location.append("node:").append(nodeName);
    }

    OpenLogsProperties.Location l = properties.getLocation();
    if (l.getLatitude() != null && l.getLongitude() != null) {
      if (location.length() > 0) {
        location.append(";");
      }
      location.append("L:").append(l.getLatitude()).append(",").append(l.getLongitude());

      StringBuilder place = new StringBuilder();
      if (l.getPlaceCountryCode() != null && !l.getPlaceCountryCode().isBlank()) {
        place.append("cc=").append(l.getPlaceCountryCode());
      }
      if (l.getPlaceCityCode() != null && !l.getPlaceCityCode().isBlank()) {
        if (place.length() > 0) {
          place.append(",");
        }
        place.append("ci=").append(l.getPlaceCityCode());
      }
      if (place.length() > 0) {
        location.append(";P:").append(place);
      }
    }

    if (location.length() == 0) {
      location.append("unknown");
    }

    StringBuilder context = new StringBuilder();
    for (Map.Entry<String, String> e : properties.getContext().entrySet()) {
      if (context.length() > 0) {
        context.append(";");
      }
      context.append(e.getKey()).append("=").append(e.getValue());
    }

    String contextFragment = context.length() > 0 ? "#C:" + context : "";
    return "tps://" + location + "@T:unix." + Instant.now().getEpochSecond() + contextFragment;
  }
}
