import { NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { OpenLogsService } from "./openlogs.service";
import { OpenLogsModuleOptions } from "./openlogs.interfaces";
export declare class OpenLogsInterceptor implements NestInterceptor {
    private readonly openLogsService;
    private readonly options;
    constructor(openLogsService: OpenLogsService, options?: OpenLogsModuleOptions);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private logRequest;
    private buildTpsUri;
    private getClientIp;
}
