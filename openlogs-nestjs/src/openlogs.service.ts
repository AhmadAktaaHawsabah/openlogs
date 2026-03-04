import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  createV2Record,
  signV2Record,
  OpenLogsV2Record,
  OpenLogsV2Entry,
} from "@nextera.one/openlogs-sdk";
import { OPENLOGS_OPTIONS, OpenLogsModuleOptions } from "./openlogs.interfaces";

@Injectable()
export class OpenLogsService {
  private readonly logger = new Logger(OpenLogsService.name);
  private currentHash: string | null = null;
  private records: OpenLogsV2Record[] = [];

  constructor(
    @Inject(OPENLOGS_OPTIONS)
    private readonly options: OpenLogsModuleOptions = {},
  ) {}

  /**
   * Push a new entry to the OpenLogs chain.
   */
  async log(
    entry: Omit<OpenLogsV2Entry, "spec" | "id">,
  ): Promise<OpenLogsV2Record> {
    try {
      // Create the record with the previous hash
      let record = createV2Record(entry, this.currentHash);

      // Sign the record if keys are provided
      if (this.options.keys) {
        record = await signV2Record(record, {
          privateKey: Buffer.from(this.options.keys.privateKeyHex, "hex"),
          publicKey: Buffer.from(this.options.keys.publicKeyHex, "hex"),
          kid: this.options.keys.kid,
        });
      }

      // Update the chain state
      this.currentHash = record.hash;
      this.records.push(record);

      this.logger.debug(
        `Logged OpenLogs entry: ${record.entry.event} [${record.hash.substring(0, 8)}]`,
      );
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to create OpenLogs record: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Retrieve the in-memory chain of records.
   */
  getChain(): OpenLogsV2Record[] {
    return [...this.records];
  }

  /**
   * Get the latest hash from the chain.
   */
  getLatestHash(): string | null {
    return this.currentHash;
  }
}
