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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = __importDefault(require("zod"));
const client_1 = require("@prisma/client");
const middlewares_1 = require("../middlewares");
//  @ts-ignore
const youtube_search_api_1 = __importDefault(require("youtube-search-api"));
const StreamRouter = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const YT_REGEX = new RegExp(/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/);
// Middleware
StreamRouter.use(express_1.default.json());
StreamRouter.use((0, cors_1.default)());
const CreateStreamSchema = zod_1.default.object({
    creatorId: zod_1.default.string(),
    url: zod_1.default.string()
});
StreamRouter.post('/', middlewares_1.verifyJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const data = CreateStreamSchema.parse(req.body);
        const isYtUrl = data.url.match(YT_REGEX);
        if (!isYtUrl) {
            return res.status(411).json("not valid youtube url");
        }
        const extractedId = data.url.split("?v=")[1];
        const { title, thumbnail } = yield youtube_search_api_1.default.GetVideoDetails(extractedId);
        const thumbnails = thumbnail.thumbnails;
        thumbnails.sort((a, b) => a.width < b.width ? -1 : 1);
        const stream = yield prisma.stream.create({
            data: {
                userId: data.creatorId,
                url: data.url,
                extractedId,
                type: "Youtube",
                title: title !== null && title !== void 0 ? title : "can't find video",
                smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : (_b = (_a = thumbnails[thumbnails.length - 1].url) !== null && _a !== void 0 ? _a : thumbnails[0].url) !== null && _b !== void 0 ? _b : "https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%3Fk%3Dfunny&psig=AOvVaw2n432g62Qe8XGVm-fHl5hR&ust=1725613615787000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCPD7kOy5q4gDFQAAAAAdAAAAABAE"),
                bigImg: thumbnails[thumbnails.length - 1].url
            }
        });
        res.status(200).json(Object.assign(Object.assign({}, stream), { hasUpvoted: false, upvotes: 0 }));
    }
    catch (e) {
        console.log(e);
        return res.status(411).json({ message: "Error while streaming" });
    }
}));
const UpVoteSchema = zod_1.default.object({
    streamId: zod_1.default.string()
});
StreamRouter.post('/upvote', middlewares_1.verifyJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const id = (_b = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.sub) === null || _b === void 0 ? void 0 : _b.split('|')[1];
    const user = yield prisma.user.findFirst({
        where: {
            id: id
        }
    });
    if (!user) {
        return res.status(403).json({
            message: "Unauthenticated"
        });
    }
    try {
        const data = UpVoteSchema.parse(req.body);
        yield prisma.upvote.create({
            data: {
                userId: id !== null && id !== void 0 ? id : "",
                streamId: (_c = data.streamId) !== null && _c !== void 0 ? _c : ""
            }
        });
        res.json({
            message: "upvote created"
        });
    }
    catch (e) {
        return res.status(411).json("Error while streaming");
    }
}));
StreamRouter.post('/downvote', middlewares_1.verifyJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const id = (_b = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.sub) === null || _b === void 0 ? void 0 : _b.split('|')[1];
    const user = yield prisma.user.findFirst({
        where: {
            id: id
        }
    });
    if (!user) {
        return res.status(403).json({
            message: "Unauthenticated"
        });
    }
    try {
        const data = UpVoteSchema.parse(req.body);
        yield prisma.upvote.delete({
            where: {
                userId_streamId: {
                    userId: id,
                    streamId: data.streamId
                }
            }
        });
        res.json({
            message: "done"
        });
    }
    catch (e) {
        return res.status(411).json("Error while streaming");
    }
}));
StreamRouter.get('/', middlewares_1.verifyJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const creatorId = req.query.creatorId;
    const userId = req.query.userId;
    if (!creatorId) {
        return res.json({ message: "wrong createrId" });
    }
    const user = yield prisma.user.findFirst({
        where: {
            id: creatorId
        }
    });
    if (!user) {
        return res.status(403).json({
            message: "Unauthenticated"
        });
    }
    try {
        let [streams, activeStream] = yield Promise.all([yield prisma.stream.findMany({
                where: {
                    userId: user.id,
                    played: false,
                    currentlyPlayed: false
                },
                include: {
                    _count: {
                        select: {
                            upvotes: true
                        }
                    },
                    upvotes: {
                        where: {
                            userId: userId
                        }
                    }
                }
            }), prisma.currentStream.findFirst({
                where: {
                    userId: creatorId,
                    stream: {
                        currentlyPlayed: true,
                        played: false
                    }
                },
                include: {
                    stream: true
                }
            })]);
        const isCreator = user.id === creatorId;
        res.json({
            streams: streams.map((_a) => {
                var { _count } = _a, rest = __rest(_a, ["_count"]);
                return (Object.assign(Object.assign({}, rest), { upvotes: _count.upvotes, haveUpvoted: rest.upvotes.length ? true : false }));
            }),
            activeStream,
            isCreator,
            creatorId
        });
    }
    catch (e) {
        return res.status(411).json("Error while fetching");
    }
}));
StreamRouter.get('/next', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const creatorId = req.query.creatorId;
    const fromButton = req.query.fromButton;
    if (!creatorId) {
        return res.json({
            message: "Invalid creator"
        });
    }
    const creator = yield prisma.user.findFirst({
        where: {
            id: creatorId
        }
    });
    if (!creator) {
        return res.json({
            message: "Creator doesn't exist"
        });
    }
    try {
        if (fromButton) {
            const PrevMostUpvotedStream = yield prisma.stream.findFirst({
                where: {
                    userId: creator.id,
                    played: false,
                    currentlyPlayed: true
                },
                orderBy: {
                    upvotes: {
                        _count: 'desc'
                    }
                }
            });
            console.log(PrevMostUpvotedStream);
            if (PrevMostUpvotedStream) {
                yield prisma.stream.update({
                    where: {
                        id: PrevMostUpvotedStream.id
                    },
                    data: {
                        played: true,
                        currentlyPlayed: false
                    }
                });
            }
        }
        const mostUpvotedStream = yield prisma.stream.findFirst({
            where: {
                userId: creator.id,
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
            return res.json({
                message: "currently no stream exists"
            });
        }
        console.log(mostUpvotedStream);
        console.log(fromButton + "fromButton");
        yield Promise.all([prisma.currentStream.upsert({
                where: {
                    userId: creator.id
                },
                update: {
                    userId: creator.id,
                    streamId: mostUpvotedStream === null || mostUpvotedStream === void 0 ? void 0 : mostUpvotedStream.id
                },
                create: {
                    userId: creator.id,
                    streamId: mostUpvotedStream === null || mostUpvotedStream === void 0 ? void 0 : mostUpvotedStream.id
                }
            }), prisma.stream.update({
                where: {
                    id: mostUpvotedStream.id,
                },
                data: {
                    currentlyPlayed: true,
                    playedTs: new Date()
                }
            })]);
        return res.json({
            mostUpvotedStream: mostUpvotedStream
        });
    }
    catch (e) {
        return res.status(411).json("Error while fetching");
    }
}));
StreamRouter.get('/', middlewares_1.verifyJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const createrId = req.query.createrId;
    try {
        const stream = yield prisma.stream.findMany({
            where: {
                userId: createrId
            }
        });
        res.json({
            stream: stream
        });
    }
    catch (e) {
        return res.status(411).json("Error while fetching");
    }
}));
exports.default = StreamRouter;
