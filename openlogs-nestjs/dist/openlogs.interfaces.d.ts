export interface OpenLogsModuleOptions {
    actor?: string;
    nodeName?: string;
    context?: Record<string, string>;
    keys?: {
        privateKeyHex: string;
        publicKeyHex: string;
        kid?: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        placeCountryCode?: string;
        placeCityCode?: string;
    };
}
export declare const OPENLOGS_OPTIONS = "OPENLOGS_OPTIONS";
