package com.nextera.one.openlogs.springboot;

import com.nextera.one.openlogs.sdk.OpenLogsChainService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@AutoConfiguration
@ConditionalOnClass(HandlerInterceptor.class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(prefix = "openlogs", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(OpenLogsProperties.class)
public class OpenLogsSpringBootAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean
  public OpenLogsChainService openLogsChainService() {
    return new OpenLogsChainService();
  }

  @Bean
  @ConditionalOnMissingBean
  public OpenLogsSpringService openLogsSpringService(
      OpenLogsChainService openLogsChainService,
      OpenLogsProperties properties
  ) {
    return new OpenLogsSpringService(openLogsChainService, properties);
  }

  @Bean
  @ConditionalOnMissingBean
  public OpenLogsHandlerInterceptor openLogsHandlerInterceptor(OpenLogsSpringService openLogsSpringService) {
    return new OpenLogsHandlerInterceptor(openLogsSpringService);
  }

  @Bean
  @ConditionalOnMissingBean(name = "openLogsWebMvcConfigurer")
  public WebMvcConfigurer openLogsWebMvcConfigurer(OpenLogsHandlerInterceptor interceptor) {
    return new WebMvcConfigurer() {
      @Override
      public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor);
      }
    };
  }
}
