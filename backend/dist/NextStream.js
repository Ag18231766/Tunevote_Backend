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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NextStrema;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function NextStrema(creatorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const mostUpvotedStream = yield prisma.stream.findFirst({
            where: {
                userId: creatorId,
                played: false
            },
            orderBy: {
                upvotes: {
                    _count: 'desc'
                }
            }
        });
        console.log(mostUpvotedStream);
        if (!mostUpvotedStream) {
            return { message: " no stream exists" };
        }
        yield Promise.all([prisma.currentStream.upsert({
                where: {
                    userId: creatorId
                },
                update: {
                    userId: creatorId,
                    streamId: mostUpvotedStream === null || mostUpvotedStream === void 0 ? void 0 : mostUpvotedStream.id
                },
                create: {
                    userId: creatorId,
                    streamId: mostUpvotedStream === null || mostUpvotedStream === void 0 ? void 0 : mostUpvotedStream.id
                }
            }), prisma.stream.update({
                where: {
                    id: mostUpvotedStream.id,
                },
                data: {
                    played: true,
                    playedTs: new Date()
                }
            })]);
        return { mostUpvotedStream: mostUpvotedStream };
    });
}
