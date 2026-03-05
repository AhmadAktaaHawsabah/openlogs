"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const openlogs_interceptor_1 = require("../openlogs.interceptor");
const rxjs_1 = require("rxjs");
const tps_standard_1 = require("@nextera.one/tps-standard");
(0, vitest_1.describe)("OpenLogsInterceptor", () => {
    let interceptor;
    let mockOpenLogsService;
    let mockExecutionContext;
    let mockCallHandler;
    (0, vitest_1.beforeEach)(() => {
        mockOpenLogsService = {
            log: vitest_1.vi.fn().mockResolvedValue({}),
        };
        mockExecutionContext = {
            getType: vitest_1.vi.fn().mockReturnValue("http"),
            switchToHttp: vitest_1.vi.fn().mockReturnValue({
                getRequest: vitest_1.vi.fn(),
                getResponse: vitest_1.vi.fn(),
            }),
        };
        mockCallHandler = {
            handle: vitest_1.vi.fn().mockReturnValue((0, rxjs_1.of)("response data")),
        };
    });
    const setupRequest = (reqData, resData) => {
        mockExecutionContext.switchToHttp.mockReturnValue({
            getRequest: () => reqData,
            getResponse: () => resData,
        });
    };
    (0, vitest_1.it)("should successfully log an HTTP request to the OpenLogsService", async () => {
        interceptor = new openlogs_interceptor_1.OpenLogsInterceptor(mockOpenLogsService, {
            actor: "system:test",
        });
        setupRequest({
            method: "POST",
            url: "/api/v1/auth",
            headers: {
                "x-forwarded-for": "203.0.113.50",
                "user-agent": "curl/7.64.1",
            },
        }, { statusCode: 201 });
        const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
        await new Promise((resolve) => {
            observable.subscribe({ complete: () => resolve() });
        });
        (0, vitest_1.expect)(mockOpenLogsService.log).toHaveBeenCalledTimes(1);
        const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];
        (0, vitest_1.expect)(loggedEntry.actor).toBe("system:test");
        (0, vitest_1.expect)(loggedEntry.event).toBe("http.request.success");
        (0, vitest_1.expect)(loggedEntry.data.method).toBe("POST");
        (0, vitest_1.expect)(loggedEntry.data.statusCode).toBe(201);
        (0, vitest_1.expect)(loggedEntry.data.userAgent).toBe("curl/7.64.1");
        (0, vitest_1.expect)(typeof loggedEntry.data.durationMs).toBe("number");
        (0, vitest_1.expect)(tps_standard_1.TPS.validate(loggedEntry.tps)).toBe(true);
    });
    (0, vitest_1.it)("should correctly format a v0.6.0 TPS URI including location and context", async () => {
        interceptor = new openlogs_interceptor_1.OpenLogsInterceptor(mockOpenLogsService, {
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
        setupRequest({
            method: "GET",
            url: "/status",
            headers: { host: "api.example.com" },
            socket: { localAddress: "10.0.0.5" },
        }, { statusCode: 200 });
        const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
        await new Promise((resolve) => {
            observable.subscribe({ complete: () => resolve() });
        });
        const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];
        const tps = loggedEntry.tps;
        (0, vitest_1.expect)(tps_standard_1.TPS.validate(tps)).toBe(true);
        (0, vitest_1.expect)(tps).toContain("net:ip4:10.0.0.5");
        (0, vitest_1.expect)(tps).toContain("node:gateway-eu");
        (0, vitest_1.expect)(tps).toContain("L:48.8566,2.3522");
        (0, vitest_1.expect)(tps).toContain("P:cc=FR");
        (0, vitest_1.expect)(tps).toContain("#C:env=production;tenant=acme");
    });
    (0, vitest_1.it)("should log an error event when the request throws an exception", async () => {
        interceptor = new openlogs_interceptor_1.OpenLogsInterceptor(mockOpenLogsService, {});
        setupRequest({ method: "GET", url: "/error", headers: {}, socket: {} }, { statusCode: 200 });
        const testError = new Error("Database connection failed");
        testError.status = 503;
        mockCallHandler.handle.mockReturnValue((0, rxjs_1.throwError)(() => testError));
        const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
        await new Promise((resolve, reject) => {
            observable.subscribe({
                error: () => resolve(),
            });
        });
        (0, vitest_1.expect)(mockOpenLogsService.log).toHaveBeenCalledTimes(1);
        const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];
        (0, vitest_1.expect)(loggedEntry.event).toBe("http.request.failed");
        (0, vitest_1.expect)(loggedEntry.data.error).toBe("Database connection failed");
        (0, vitest_1.expect)(loggedEntry.data.statusCode).toBe(503);
    });
    (0, vitest_1.it)("should auto-assign client IP as actor if no fixed actor is provided", async () => {
        interceptor = new openlogs_interceptor_1.OpenLogsInterceptor(mockOpenLogsService, {});
        setupRequest({
            method: "GET",
            url: "/",
            headers: {},
            socket: { remoteAddress: "::ffff:192.0.2.1" },
        }, { statusCode: 200 });
        const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
        await new Promise((resolve) => {
            observable.subscribe({ complete: () => resolve() });
        });
        const loggedEntry = mockOpenLogsService.log.mock.calls[0][0];
        (0, vitest_1.expect)(loggedEntry.actor).toBe("client:::ffff:192.0.2.1");
    });
});
//# sourceMappingURL=interceptor.test.js.map