import * as cookie from "cookie";
import { Server } from "http";
import Redis from "ioredis";
import { Server as SocketServer } from "socket.io";
import {
  handleFetchMessages,
  handleNewUser,
  handleSendMessage,
  handleUserOffline,
} from "../controllers/socketLogic";
import { generateRandomString } from "../utils/random";
import { messageModel } from "./interfaces";
import { getRedisClient } from "./redisConfig";

const redisParentClient: Redis = getRedisClient() as Redis;

const socketConfig = (server: Server) => {
  const allowedOrigins: string[] = process.env.CORS_DOMAIN!.split(",");

  const io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
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
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // set cookie if it does not exist
  io.engine.on("initial_headers", (headers, request) => {
    console.log("engine");
    const cookies = cookie.parse(request.headers.cookie || "");
    if (!cookies["user.sid"]) {
      let isDev = process.env.ENV === "dev";
      const setCookieHeader = cookie.serialize(
        "user.sid",
        generateRandomString(16),
        {
          httpOnly: false,
          sameSite: isDev ? "strict" : "none",
          secure: true,
          path: "/",
          domain: process.env.COOKIE_DOMAIN,
          maxAge: 24 * 60 * 60, // 1 day in seconds
        }
      );
      headers["Set-Cookie"] = setCookieHeader;
    }
  });

  // check if cookie exists and insert cookie value in handshake
  io.use((socket, next) => {
    console.log("middleware");
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      console.log("cookies", cookies);
      if (!cookies["user.sid"]) {
        throw new Error("No Cookie");
      }
      socket.handshake.auth.cookie = cookies["user.sid"];
      console.log("end");
      next();
    } catch (e) {
      let message = "Some Error Occured!";
      if (e instanceof Error) {
        message = e.message;
      }
      console.log("message", message);
      next(new Error(message));
    }
  });

  io.on("connection", async (socket) => {
    // if (redisClient.isOpen) {
    //   console.log("Redis Client is already connected");
    // } else {
    // }
    try {
      console.log("socket connected", socket.id);
      // handle new user added
      let cookie = socket.handshake.auth.cookie;
      await handleNewUser(io, socket, redisParentClient, cookie);

      // handle user leave
      socket.on("disconnect", async () => {
        console.log("disconnected");
        await handleUserOffline(io, redisParentClient, cookie);
      });

      // handle message send
      socket.on(
        messageModel,
        async (data: { receiver: string; message: string }) => {
          let { message, receiver } = data;
          await handleSendMessage(
            io,
            redisParentClient,
            cookie,
            receiver,
            message
          );
        }
      );

      // handle message fetch
      socket.on("messagesFetch", async (data: { recipientId: string }) => {
        let { recipientId } = data;
        await handleFetchMessages(io, redisParentClient, cookie, recipientId);
      });
    } catch (e) {
      let message = "Some Error Occured";
      if (e instanceof Error) {
        message = e.message;
      }
      console.log("Error While Adding new User, Reason : ", message);
    }
  });
};

export { redisParentClient, socketConfig };
