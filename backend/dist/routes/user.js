"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const middlewares_1 = require("../middlewares");
const client_1 = require("@prisma/client");
const UserRouter = express_1.default.Router();
const prisma = new client_1.PrismaClient();
UserRouter.use((0, cors_1.default)());
UserRouter.use(express_1.default.json());
UserRouter.post('/:email', middlewares_1.verifyJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = (_b = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.sub) === null || _b === void 0 ? void 0 : _b.split('|')[1]; // Extract the token
        const useremail = req.params.email;
        const user = yield prisma.user.findFirst({
            where: {
                id: id,
                email: useremail
            }
        });
        if (user) {
            return res.json({
                message: 'user logged in successfully'
            });
        }
        yield prisma.user.create({
            data: {
                id: id,
                email: useremail
            }
        });
        return res.json({
            message: "user created successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching user details',
            error: error
        });
    }
}));
exports.default = UserRouter;
