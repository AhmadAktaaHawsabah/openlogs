import { Module, DynamicModule, Global } from "@nestjs/common";
import { OpenLogsService } from "./openlogs.service";
import { OpenLogsInterceptor } from "./openlogs.interceptor";
import { OPENLOGS_OPTIONS, OpenLogsModuleOptions } from "./openlogs.interfaces";

import { APP_INTERCEPTOR } from "@nestjs/core";

@Global()
@Module({})
export class OpenLogsModule {
  static forRoot(options: OpenLogsModuleOptions = {}): DynamicModule {
    return {
      module: OpenLogsModule,
      providers: [
        {
          provide: OPENLOGS_OPTIONS,
          useValue: options,
        },
        OpenLogsService,
        OpenLogsInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: OpenLogsInterceptor,
        },
      ],
      exports: [OpenLogsService, OpenLogsInterceptor],
    };
  }
}
