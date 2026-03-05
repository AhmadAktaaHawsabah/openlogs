package com.nextera.one.openlogs.springboot;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;

public class OpenLogsHandlerInterceptor implements HandlerInterceptor {
  private static final Logger log = LoggerFactory.getLogger(OpenLogsHandlerInterceptor.class);
  private static final String START_TIME_ATTR = "openlogs.startTime";

  private final OpenLogsSpringService openLogsSpringService;

  public OpenLogsHandlerInterceptor(OpenLogsSpringService openLogsSpringService) {
    this.openLogsSpringService = openLogsSpringService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    request.setAttribute(START_TIME_ATTR, System.currentTimeMillis());
    return true;
  }

  @Override
  public void afterCompletion(
      HttpServletRequest request,
      HttpServletResponse response,
      Object handler,
      Exception ex
  ) {
    long start = request.getAttribute(START_TIME_ATTR) instanceof Long
        ? (Long) request.getAttribute(START_TIME_ATTR)
        : System.currentTimeMillis();

    long duration = Math.max(0, System.currentTimeMillis() - start);

    try {
      openLogsSpringService.logHttpRequest(request, response.getStatus(), duration, ex);
    } catch (Exception logError) {
      // Never break application flow because telemetry failed.
      log.warn("OpenLogs interceptor failed to emit a record", logError);
    }
  }
}
