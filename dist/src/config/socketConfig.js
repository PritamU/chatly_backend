"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketConfig = void 0;
const cookie_1 = __importDefault(require("cookie"));
const socket_io_1 = require("socket.io");
const socketLogic_1 = require("../controllers/socketLogic");
const random_1 = require("../utils/random");
const interfaces_1 = require("./interfaces");
const redisConfig_1 = require("./redisConfig");
const socketConfig = (server) => {
    const allowedOrigins = process.env.CORS_DOMAIN.split(",");
    const redisClient = (0, redisConfig_1.getRedisClient)();
    redisClient.connect();
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                let allowed = true;
                if (origin) {
                    allowed = allowedOrigins.includes(origin);
                }
                // Check if the request's origin is in the allowed origins list
                if (allowed) {
                    callback(null, true);
                }
                else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    // set cookie if it does not exist
    io.engine.on("initial_headers", (headers, request) => {
        console.log("engine");
        const cookies = cookie_1.default.parse(request.headers.cookie || "");
        if (!cookies["user.sid"]) {
            const setCookieHeader = cookie_1.default.serialize("user.sid", (0, random_1.generateRandomString)(16), {
                httpOnly: false,
                sameSite: "strict",
                path: "/",
                maxAge: 24 * 60 * 60, // 1 day in seconds
            });
            headers["Set-Cookie"] = setCookieHeader;
        }
    });
    // check if cookie exists and insert cookie value in handshake
    io.use((socket, next) => {
        console.log("middleware");
        try {
            const cookies = cookie_1.default.parse(socket.handshake.headers.cookie || "");
            console.log("cookies", cookies);
            if (!cookies["user.sid"]) {
                throw new Error("No Cookie");
            }
            socket.handshake.auth.cookie = cookies["user.sid"];
            console.log("end");
            next();
        }
        catch (e) {
            let message = "Some Error Occured!";
            if (e instanceof Error) {
                message = e.message;
            }
            console.log("message", message);
            next(new Error(message));
        }
    });
    io.on("connection", async (socket) => {
        console.log("connection");
        // if (redisClient.isOpen) {
        //   console.log("Redis Client is already connected");
        // } else {
        // }
        try {
            console.log("socket connected", socket.id);
            // handle new user added
            let cookie = socket.handshake.auth.cookie;
            await (0, socketLogic_1.handleNewUser)(io, socket, redisClient, cookie);
            // handle user leave
            socket.on("disconnect", async () => {
                console.log("disconnected");
                await (0, socketLogic_1.handleUserOffline)(io, redisClient, cookie);
                // redisClient.disconnect();
            });
            // handle message send
            socket.on(interfaces_1.messageModel, async (data) => {
                let { message, receiver } = data;
                await (0, socketLogic_1.handleSendMessage)(io, redisClient, cookie, receiver, message);
            });
            // handle message fetch
            socket.on("messagesFetch", async (data) => {
                let { recipientId } = data;
                await (0, socketLogic_1.handleFetchMessages)(io, redisClient, cookie, recipientId);
            });
        }
        catch (e) {
            let message = "Some Error Occured";
            if (e instanceof Error) {
                message = e.message;
            }
            console.log("Error While Adding new User, Reason : ", message);
        }
    });
};
exports.socketConfig = socketConfig;
