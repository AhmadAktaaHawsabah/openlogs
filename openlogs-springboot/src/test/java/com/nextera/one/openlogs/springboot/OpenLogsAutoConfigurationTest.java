package com.nextera.one.openlogs.springboot;

import com.nextera.one.openlogs.sdk.OpenLogsChainService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class OpenLogsAutoConfigurationTest {
  private final WebApplicationContextRunner contextRunner = new WebApplicationContextRunner()
      .withConfiguration(AutoConfigurations.of(
          WebMvcAutoConfiguration.class,
          OpenLogsSpringBootAutoConfiguration.class
      ));

  @Test
  void registersBeansWhenEnabled() {
    contextRunner
        .withPropertyValues("openlogs.enabled=true")
        .run(context -> {
          assertThat(context).hasSingleBean(OpenLogsProperties.class);
          assertThat(context).hasSingleBean(OpenLogsChainService.class);
          assertThat(context).hasSingleBean(OpenLogsSpringService.class);
          assertThat(context).hasSingleBean(OpenLogsHandlerInterceptor.class);
        });
  }

  @Test
  void doesNotRegisterWhenDisabled() {
    contextRunner
        .withPropertyValues("openlogs.enabled=false")
        .run(context -> {
          assertThat(context).doesNotHaveBean(OpenLogsSpringService.class);
          assertThat(context).doesNotHaveBean(OpenLogsHandlerInterceptor.class);
        });
  }
}
