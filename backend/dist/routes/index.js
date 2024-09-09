"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const streams_1 = __importDefault(require("./streams"));
const user_1 = __importDefault(require("./user"));
const RootRouter = express_1.default.Router();
RootRouter.use((0, cors_1.default)());
RootRouter.use('/streams', streams_1.default);
RootRouter.use('/user', user_1.default);
exports.default = RootRouter;
