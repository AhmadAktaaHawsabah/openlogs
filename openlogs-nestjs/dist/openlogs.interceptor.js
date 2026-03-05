"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLogsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const openlogs_service_1 = require("./openlogs.service");
const openlogs_interfaces_1 = require("./openlogs.interfaces");
const tps_standard_1 = require("@nextera.one/tps-standard");
let OpenLogsInterceptor = class OpenLogsInterceptor {
    constructor(openLogsService, options = {}) {
        this.openLogsService = openLogsService;
        this.options = options;
    }
    intercept(context, next) {
        const startTime = Date.now();
        const tpsDate = new Date(startTime);
        return next.handle().pipe((0, operators_1.tap)({
            next: () => this.logRequest(context, tpsDate, startTime, null),
            error: (error) => this.logRequest(context, tpsDate, startTime, error),
        }));
    }
    async logRequest(context, date, startTime, error) {
        if (context.getType() !== "http") {
            return;
        }
        const durationMs = Date.now() - startTime;
        const httpCtx = context.switchToHttp();
        const req = httpCtx.getRequest();
        const res = httpCtx.getResponse();
        const tpsUri = this.buildTpsUri(req, date);
        const actor = this.options.actor || `client:${this.getClientIp(req)}`;
        const event = error ? "http.request.failed" : "http.request.success";
        const statusCode = error ? error.status || 500 : res.statusCode;
        const data = {
            method: req.method,
            url: req.url,
            statusCode,
            durationMs,
            userAgent: req.headers["user-agent"] || "unknown",
            ...(error && { error: error.message }),
        };
        const indexes = {
            method: req.method,
            status: String(statusCode),
        };
        try {
            await this.openLogsService.log({
                actor,
                tps: tpsUri,
                event,
                data,
                indexes,
            });
        }
        catch (err) {
            console.error("[OpenLogsInterceptor] Failed to log request", err);
        }
    }
    buildTpsUri(req, date) {
        const timeTokens = tps_standard_1.TPS.fromDate(date);
        let locationParts = [];
        const serverIp = req.socket?.localAddress;
        if (serverIp) {
            if (serverIp.includes(":")) {
                locationParts.push(`net:ip6:${serverIp}`);
            }
            else {
                locationParts.push(`net:ip4:${serverIp}`);
            }
        }
        if (this.options.nodeName) {
            locationParts.push(`node:${this.options.nodeName}`);
        }
        else {
            const host = req.headers["host"];
            if (host)
                locationParts.push(`node:${host.split(":")[0]}`);
        }
        if (this.options.location?.latitude && this.options.location?.longitude) {
            const l = this.options.location;
            let gps = `L:${l.latitude},${l.longitude}`;
            locationParts.push(gps);
            let placeParts = [];
            if (l.placeCountryCode)
                placeParts.push(`cc=${l.placeCountryCode}`);
            if (l.placeCityCode)
                placeParts.push(`ci=${l.placeCityCode}`);
            if (placeParts.length > 0) {
                locationParts.push(`P:${placeParts.join(",")}`);
            }
        }
        let ctxString = "";
        if (this.options.context) {
            const parts = Object.entries(this.options.context)
                .map(([k, v]) => `${k}=${v}`)
                .join(";");
            ctxString = `#C:${parts}`;
        }
        const locationPrefix = locationParts.length > 0 ? locationParts.join(";") : "unknown";
        return `tps://${locationPrefix}@${timeTokens}${ctxString}`;
    }
    getClientIp(req) {
        const forwardedStr = req.headers["x-forwarded-for"];
        if (forwardedStr) {
            const forwarded = forwardedStr.split(",")[0];
            return forwarded.trim();
        }
        return req.socket?.remoteAddress || "unknown";
    }
};
exports.OpenLogsInterceptor = OpenLogsInterceptor;
exports.OpenLogsInterceptor = OpenLogsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(openlogs_interfaces_1.OPENLOGS_OPTIONS)),
    __metadata("design:paramtypes", [openlogs_service_1.OpenLogsService, Object])
], OpenLogsInterceptor);
//# sourceMappingURL=openlogs.interceptor.js.map