export interface OpenLogsModuleOptions {
  /**
   * The actor prefix or fixed actor to use for logging requests.
   * If a static string, it will be used for all requests (e.g., 'system:api').
   * If omitted, the interceptor defaults to 'client:[ip]'
   */
  actor?: string;

  /**
   * Node name to include in the TPS URI digital location layer (e.g., 'api-1')
   */
  nodeName?: string;

  /**
   * Optional context to include in every TPS URI `#C:` fragment.
   * Useful for environment tags, region, etc.
   */
  context?: Record<string, string>;

  /**
   * Optional cryptographic keys to automatically sign records.
   */
  keys?: {
    privateKeyHex: string;
    publicKeyHex: string;
    kid?: string;
  };

  /**
   * Fallback physical location for the TPS URI if you want static GPS coords.
   */
  location?: {
    latitude: number;
    longitude: number;
    placeCountryCode?: string;
    placeCityCode?: string;
  };
}

export const OPENLOGS_OPTIONS = "OPENLOGS_OPTIONS";
