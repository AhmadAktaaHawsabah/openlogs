package com.nextera.one.openlogs.springboot;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "openlogs")
public class OpenLogsProperties {
  private boolean enabled = true;
  private String actor;
  private String nodeName;
  private Map<String, String> context = new LinkedHashMap<>();
  private Location location = new Location();

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getActor() {
    return actor;
  }

  public void setActor(String actor) {
    this.actor = actor;
  }

  public String getNodeName() {
    return nodeName;
  }

  public void setNodeName(String nodeName) {
    this.nodeName = nodeName;
  }

  public Map<String, String> getContext() {
    return context;
  }

  public void setContext(Map<String, String> context) {
    this.context = context == null ? new LinkedHashMap<>() : new LinkedHashMap<>(context);
  }

  public Location getLocation() {
    return location;
  }

  public void setLocation(Location location) {
    this.location = location == null ? new Location() : location;
  }

  public static class Location {
    private Double latitude;
    private Double longitude;
    private String placeCountryCode;
    private String placeCityCode;

    public Double getLatitude() {
      return latitude;
    }

    public void setLatitude(Double latitude) {
      this.latitude = latitude;
    }

    public Double getLongitude() {
      return longitude;
    }

    public void setLongitude(Double longitude) {
      this.longitude = longitude;
    }

    public String getPlaceCountryCode() {
      return placeCountryCode;
    }

    public void setPlaceCountryCode(String placeCountryCode) {
      this.placeCountryCode = placeCountryCode;
    }

    public String getPlaceCityCode() {
      return placeCityCode;
    }

    public void setPlaceCityCode(String placeCityCode) {
      this.placeCityCode = placeCityCode;
    }
  }
}
