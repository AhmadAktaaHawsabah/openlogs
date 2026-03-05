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
var OpenLogsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLogsService = void 0;
const common_1 = require("@nestjs/common");
const openlogs_sdk_1 = require("@nextera.one/openlogs-sdk");
const openlogs_interfaces_1 = require("./openlogs.interfaces");
let OpenLogsService = OpenLogsService_1 = class OpenLogsService {
    constructor(options = {}) {
        this.options = options;
        this.logger = new common_1.Logger(OpenLogsService_1.name);
        this.currentHash = null;
        this.records = [];
    }
    async log(entry) {
        try {
            let record = (0, openlogs_sdk_1.createV2Record)(entry, this.currentHash);
            if (this.options.keys) {
                record = await (0, openlogs_sdk_1.signV2Record)(record, {
                    privateKey: Buffer.from(this.options.keys.privateKeyHex, "hex"),
                    publicKey: Buffer.from(this.options.keys.publicKeyHex, "hex"),
                    kid: this.options.keys.kid,
                });
            }
            this.currentHash = record.hash;
            this.records.push(record);
            this.logger.debug(`Logged OpenLogs entry: ${record.entry.event} [${record.hash.substring(0, 8)}]`);
            return record;
        }
        catch (error) {
            this.logger.error(`Failed to create OpenLogs record: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    getChain() {
        return [...this.records];
    }
    getLatestHash() {
        return this.currentHash;
    }
};
exports.OpenLogsService = OpenLogsService;
exports.OpenLogsService = OpenLogsService = OpenLogsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(openlogs_interfaces_1.OPENLOGS_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], OpenLogsService);
//# sourceMappingURL=openlogs.service.js.map