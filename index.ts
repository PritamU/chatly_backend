import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import createHttpError from "http-errors";
import morgan from "morgan";
import { socketConfig } from "./src/config/socketConfig";
import { ErrorCodes } from "./src/constants/errorCodes";
import userRoutes from "./src/routes/userRoutes";

dotenv.config();
const app = express();
const server = createServer(app);

// configure socket
socketConfig(server);

app.use(express.json());
app.use(morgan("dev"));
const allowedOrigins: string[] = process.env.CORS_DOMAIN!.split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("origin", origin);
      let allowed = true;
      if (origin) {
        allowed = allowedOrigins.includes(origin);
      }
      // Check if the request's origin is in the allowed origins list
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "user.sid"], // Add any custom headers
    credentials: true,
  })
);
app.options("*", cors()); // Handle preflight requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", async (req: Request, res: Response): Promise<void> => {
  res.send("Server is Active!");
  return;
});

app.use("/user", userRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log("Route Not Found");
  return next(createHttpError(ErrorCodes.not_found, "Route not Found!"));
});

// error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
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
