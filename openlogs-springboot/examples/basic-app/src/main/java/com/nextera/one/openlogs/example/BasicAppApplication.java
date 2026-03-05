package com.nextera.one.openlogs.example;

import com.nextera.one.openlogs.springboot.OpenLogsSpringService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@SpringBootApplication
public class BasicAppApplication {
  public static void main(String[] args) {
    SpringApplication.run(BasicAppApplication.class, args);
  }

  @RestController
  static class BasicController {
    private final OpenLogsSpringService openLogsSpringService;

    BasicController(OpenLogsSpringService openLogsSpringService) {
      this.openLogsSpringService = openLogsSpringService;
    }

    @GetMapping("/")
    public String hello() {
      return "Hello OpenLogs API!";
    }

    @GetMapping("/error")
    public String error() {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong!");
    }

    @GetMapping("/chain")
    public List<Map<String, Object>> chain() {
      return openLogsSpringService.getChain().stream()
          .map(r -> Map.<String, Object>of(
              "id", r.getId(),
              "hash", r.getHash(),
              "event", r.getEntry().getEvent(),
              "tps", r.getEntry().getTps()
          ))
          .toList();
    }
  }
}
