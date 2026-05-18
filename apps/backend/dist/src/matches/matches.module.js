"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesModule = void 0;
const common_1 = require("@nestjs/common");
const matches_controller_1 = require("./matches.controller");
const matches_service_1 = require("./matches.service");
const match_events_service_1 = require("./match-events.service");
const prisma_module_1 = require("../prisma/prisma.module");
const predictions_module_1 = require("../predictions/predictions.module");
let MatchesModule = class MatchesModule {
};
exports.MatchesModule = MatchesModule;
exports.MatchesModule = MatchesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, predictions_module_1.PredictionsModule],
        controllers: [matches_controller_1.MatchesController],
        providers: [matches_service_1.MatchesService, match_events_service_1.MatchEventsService],
        exports: [matches_service_1.MatchesService, match_events_service_1.MatchEventsService],
    })
], MatchesModule);
//# sourceMappingURL=matches.module.js.map