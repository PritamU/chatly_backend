"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAuth = exports.getUser = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const interfaces_1 = require("../config/interfaces");
const redisConfig_1 = require("../config/redisConfig");
const errorCodes_1 = require("../constants/errorCodes");
const userAuth = async (req, res, next) => {
    try {
        const redisClient = (0, redisConfig_1.getRedisClient)();
        redisClient.connect();
        let cookie = req.cookies;
        let userId = cookie["user.sid"];
        if (!userId) {
            return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.unauthenticated, "Authentication Required!"));
        }
        let usersData = await redisClient.sMembers(interfaces_1.userModel);
        if (!usersData) {
            throw new Error("No User Found!");
        }
        let currentUser = null;
        usersData.map((userItem) => {
            let userInUnknownFormat = JSON.parse(userItem);
            let userInRequiredFormat = userInUnknownFormat;
            if (userInRequiredFormat.id === userId) {
                currentUser = userInRequiredFormat;
            }
        });
        if (!currentUser) {
            return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.unauthorized, "Invalid Auth Credentials!"));
        }
        res.json({ status: true, data: currentUser });
        return;
    }
    catch (e) {
        let message = "Some Error Occured";
        if (e instanceof Error) {
            message = e.message;
        }
        return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.server_error, message));
    }
};
exports.userAuth = userAuth;
const getUser = async (req, res, next) => {
    try {
        const redisClient = (0, redisConfig_1.getRedisClient)();
        redisClient.connect();
        let cookie = req.cookies;
        let userId = cookie["user.sid"];
        let { chatUserId } = req.params;
        if (!userId) {
            return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.unauthenticated, "Authentication Required!"));
        }
        if (!chatUserId) {
            return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.not_found, "User ID Required!"));
        }
        let usersData = await redisClient.sMembers(interfaces_1.userModel);
        if (!usersData) {
            throw new Error("No User Found!");
        }
        let currentUser = null;
        let chatUser = null;
        usersData.map((userItem) => {
            let userInUnknownFormat = JSON.parse(userItem);
            let userInRequiredFormat = userInUnknownFormat;
            if (userInRequiredFormat.id === userId) {
                currentUser = userInRequiredFormat;
            }
            if (userInRequiredFormat.id === chatUserId) {
                chatUser = userInRequiredFormat;
            }
        });
        if (!currentUser) {
            return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.unauthorized, "Invalid Auth Credentials!"));
        }
        if (!chatUser) {
            return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.not_found, "User Not Found!"));
        }
        res.json({ status: true, data: chatUser });
        return;
    }
    catch (e) {
        let message = "Some Error Occured";
        if (e instanceof Error) {
            message = e.message;
        }
        return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.server_error, message));
    }
};
exports.getUser = getUser;
