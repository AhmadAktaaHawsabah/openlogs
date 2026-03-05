import { OpenLogsV2Record, OpenLogsV2Entry } from "@nextera.one/openlogs-sdk";
import { OpenLogsModuleOptions } from "./openlogs.interfaces";
export declare class OpenLogsService {
    private readonly options;
    private readonly logger;
    private currentHash;
    private records;
    constructor(options?: OpenLogsModuleOptions);
    log(entry: Omit<OpenLogsV2Entry, "spec" | "id">): Promise<OpenLogsV2Record>;
    getChain(): OpenLogsV2Record[];
    getLatestHash(): string | null;
}
