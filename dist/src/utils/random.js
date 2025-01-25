"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = generateRandomString;
const crypto_1 = __importDefault(require("crypto"));
function generateRandomString(length) {
    return crypto_1.default
        .randomBytes(Math.ceil(length / 2))
        .toString("hex") // Convert to hexadecimal format
        .slice(0, length); // Return required number of characters
}
