"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const http_errors_1 = __importDefault(require("http-errors"));
const morgan_1 = __importDefault(require("morgan"));
const socketConfig_1 = require("./src/config/socketConfig");
const errorCodes_1 = require("./src/constants/errorCodes");
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
dotenv_1.default.config();
// configure socket
(0, socketConfig_1.socketConfig)(server);
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
const allowedOrigins = process.env.CORS_DOMAIN.split(",");
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log("origin", origin);
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
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "user.sid"], // Add any custom headers
    credentials: true,
}));
app.options("*", (0, cors_1.default)()); // Handle preflight requests
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.get("/", async (req, res) => {
    res.send("Server is Active!");
    return;
});
app.use("/user", userRoutes_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    console.log("Route Not Found");
    return next((0, http_errors_1.default)(errorCodes_1.ErrorCodes.not_found, "Route not Found!"));
});
// error handler
app.use((error, req, res, next) => {
    console.log("main error handler", error.message);
    res.status(error.status || 500).json({
        status: false,
        message: error.message,
    });
    return;
});
server.listen(process.env.PORT || 5051, () => {
    console.log(`Server is listening at ${process.env.PORT}`);
});
