import { describe, expect, it, vi, beforeEach } from "vitest";
import { OpenLogsInterceptor } from "../openlogs.interceptor";
import { OpenLogsService } from "../openlogs.service";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { TPS } from "@nextera.one/tps-standard";

describe("OpenLogsInterceptor", () => {
  let interceptor: OpenLogsInterceptor;
  let mockOpenLogsService: any;
  let mockExecutionContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    mockOpenLogsService = {
      log: vi.fn().mockResolvedValue({}),
    };

    mockExecutionContext = {
      getType: vi.fn().mockReturnValue("http"),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn(),
        getResponse: vi.fn(),
      }),
    };

    mockCallHandler = {
      handle: vi.fn().mockReturnValue(of("response data")),
    };
  });

  const setupRequest = (reqData: any, resData: any) => {
    mockExecutionContext.switchToHttp.mockReturnValue({
      getRequest: () => reqData,
      getResponse: () => resData,
    });
  };

  it("should successfully log an HTTP request to the OpenLogsService", async () => {
    interceptor = new OpenLogsInterceptor(mockOpenLogsService, {
      actor: "system:test",
    });

    setupRequest(
      {
        method: "POST",
        url: "/api/v1/auth",
        headers: {
          "x-forwarded-for": "203.0.113.50",
          "user-agent": "curl/7.64.1",
        },
      },
      { statusCode: 201 },
    );

    const observable = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );

    // Subscribe to execute the tap
    await new Promise<void>((resolve) => {
      observable.subscribe({ complete: () => resolve() });
    });

    expect(mockOpenLogsService.log).toHaveBeenCalledTimes(1);

    const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];

    expect(loggedEntry.actor).toBe("system:test");
    expect(loggedEntry.event).toBe("http.request.success");
    expect(loggedEntry.data.method).toBe("POST");
    expect(loggedEntry.data.statusCode).toBe(201);
    expect(loggedEntry.data.userAgent).toBe("curl/7.64.1");
    expect(typeof loggedEntry.data.durationMs).toBe("number");

    // Check TPS string conforms to standard
    expect(TPS.validate(loggedEntry.tps)).toBe(true);
  });

  it("should correctly format a v0.6.0 TPS URI including location and context", async () => {
    interceptor = new OpenLogsInterceptor(mockOpenLogsService, {
      nodeName: "gateway-eu",
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        placeCountryCode: "FR",
      },
      context: {
        env: "production",
        tenant: "acme",
      },
    });

    setupRequest(
      {
        method: "GET",
        url: "/status",
        headers: { host: "api.example.com" },
        socket: { localAddress: "10.0.0.5" },
      },
      { statusCode: 200 },
    );

    const observable = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );

    await new Promise<void>((resolve) => {
      observable.subscribe({ complete: () => resolve() });
    });

    const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];

    const tps = loggedEntry.tps;
    expect(TPS.validate(tps)).toBe(true);

    // Verify specific layer strings appear
    expect(tps).toContain("net:ip4:10.0.0.5");
    expect(tps).toContain("node:gateway-eu");
    expect(tps).toContain("L:48.8566,2.3522");
    expect(tps).toContain("P:cc=FR");
    expect(tps).toContain("#C:env=production;tenant=acme");
  });

  it("should log an error event when the request throws an exception", async () => {
    interceptor = new OpenLogsInterceptor(mockOpenLogsService, {});

    setupRequest(
      { method: "GET", url: "/error", headers: {}, socket: {} },
      { statusCode: 200 }, // Error overrides this
    );

    const testError = new Error("Database connection failed");
    (testError as any).status = 503;

    mockCallHandler.handle.mockReturnValue(throwError(() => testError));

    const observable = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        error: () => resolve(), // We expect the error to pass through
      });
    });

    expect(mockOpenLogsService.log).toHaveBeenCalledTimes(1);
    const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];

    expect(loggedEntry.event).toBe("http.request.failed");
    expect(loggedEntry.data.error).toBe("Database connection failed");
    expect(loggedEntry.data.statusCode).toBe(503);
  });

  it("should auto-assign client IP as actor if no fixed actor is provided", async () => {
    interceptor = new OpenLogsInterceptor(mockOpenLogsService, {});

    setupRequest(
      {
        method: "GET",
        url: "/",
        headers: {},
        socket: { remoteAddress: "::ffff:192.0.2.1" }, // IPv6 mapped IPv4
      },
      { statusCode: 200 },
    );

    const observable = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );

    await new Promise<void>((resolve) => {
      observable.subscribe({ complete: () => resolve() });
    });

    const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];
    expect(loggedEntry.actor).toBe("client:::ffff:192.0.2.1");
  });
});
