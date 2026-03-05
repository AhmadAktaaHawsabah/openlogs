package com.nextera.one.openlogs.springboot;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
    classes = OpenLogsHttpE2ETest.TestApp.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "openlogs.enabled=true",
        "openlogs.node-name=e2e-api",
        "openlogs.context.env=test"
    }
)
class OpenLogsHttpE2ETest {
  @Autowired
  private TestRestTemplate restTemplate;

  @Autowired
  private OpenLogsSpringService openLogsSpringService;

  @Test
  void logsSuccessAndErrorRequests() {
    ResponseEntity<String> ok = restTemplate.getForEntity("/", String.class);
    ResponseEntity<String> fail = restTemplate.getForEntity("/error", String.class);

    assertThat(ok.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(fail.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);

    assertThat(openLogsSpringService.getChain())
        .isNotEmpty()
        .extracting(r -> r.getEntry().getEvent())
        .contains("http.request.success", "http.request.failed");
  }

  @SpringBootConfiguration
  @EnableAutoConfiguration
  static class TestApp {
    @Bean
    TestController testController() {
      return new TestController();
    }
  }

  @RestController
  static class TestController {
    @GetMapping("/")
    String hello() {
      return "ok";
    }

    @GetMapping("/error")
    String error() {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "boom");
    }
  }
}
