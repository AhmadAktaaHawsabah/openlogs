"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OpenLogsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLogsModule = void 0;
const common_1 = require("@nestjs/common");
const openlogs_service_1 = require("./openlogs.service");
const openlogs_interceptor_1 = require("./openlogs.interceptor");
const openlogs_interfaces_1 = require("./openlogs.interfaces");
const core_1 = require("@nestjs/core");
let OpenLogsModule = OpenLogsModule_1 = class OpenLogsModule {
    static forRoot(options = {}) {
        return {
            module: OpenLogsModule_1,
            providers: [
                {
                    provide: openlogs_interfaces_1.OPENLOGS_OPTIONS,
                    useValue: options,
                },
                openlogs_service_1.OpenLogsService,
                openlogs_interceptor_1.OpenLogsInterceptor,
                {
                    provide: core_1.APP_INTERCEPTOR,
                    useExisting: openlogs_interceptor_1.OpenLogsInterceptor,
                },
            ],
            exports: [openlogs_service_1.OpenLogsService, openlogs_interceptor_1.OpenLogsInterceptor],
        };
    }
};
exports.OpenLogsModule = OpenLogsModule;
exports.OpenLogsModule = OpenLogsModule = OpenLogsModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], OpenLogsModule);
//# sourceMappingURL=openlogs.module.js.map