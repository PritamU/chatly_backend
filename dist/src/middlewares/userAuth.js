"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const errorCodes_1 = require("../constants/errorCodes");
const random_1 = require("../utils/random");
const userAuthMiddleware = async (req, res, next) => {
    try {
        let cookie = req.cookies["user.sid"];
        let generatedCookie = (0, random_1.generateRandomString)(16);
        if (!cookie) {
            res.cookie("user.sid", generatedCookie, {
                httpOnly: false,
                sameSite: "strict",
                path: "/",
                maxAge: 24 * 60 * 60, // 1 day in seconds
            });
        }
    }
    catch (e) {
        let message = "Some Error Occured";
        if (e instanceof Error) {
            message = e.message;
        }
        return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.server_error, message));
    }
    finally {
        next();
    }
};
