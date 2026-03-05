import { DynamicModule } from "@nestjs/common";
import { OpenLogsModuleOptions } from "./openlogs.interfaces";
export declare class OpenLogsModule {
    static forRoot(options?: OpenLogsModuleOptions): DynamicModule;
}
