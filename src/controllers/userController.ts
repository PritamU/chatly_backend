import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { RedisClientType } from "redis";
import { UserInterface, userModel } from "../config/interfaces";
import { getRedisClient } from "../config/redisConfig";
import { ErrorCodes } from "../constants/errorCodes";

const userAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redisClient: RedisClientType = getRedisClient() as RedisClientType;
    redisClient.connect();

    let cookie = req.cookies;
    let userId = cookie["user.sid"];
    if (!userId) {
      return next(
        createHttpError(ErrorCodes.unauthenticated, "Authentication Required!")
      );
    }
    let usersData: string[] | null = await redisClient.sMembers(userModel);
    if (!usersData) {
      throw new Error("No User Found!");
    }

    let currentUser: null | UserInterface = null;
    usersData.map((userItem) => {
      let userInUnknownFormat: unknown = JSON.parse(userItem) as unknown;
      let userInRequiredFormat: UserInterface =
        userInUnknownFormat as UserInterface;
      if (userInRequiredFormat.id === userId) {
        currentUser = userInRequiredFormat;
      }
    });

    if (!currentUser) {
      return next(
        createHttpError(ErrorCodes.unauthorized, "Invalid Auth Credentials!")
      );
    }

    res.json({ status: true, data: currentUser });
    return;
  } catch (e) {
    let message = "Some Error Occured";
    if (e instanceof Error) {
      message = e.message;
    }
    return next(createHttpError(ErrorCodes.server_error, message));
  }
};

const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redisClient: RedisClientType = getRedisClient() as RedisClientType;
    redisClient.connect();
    let cookie = req.cookies;
    let userId = cookie["user.sid"];
    let { chatUserId }: { chatUserId?: string } = req.params;
    if (!userId) {
      return next(
        createHttpError(ErrorCodes.unauthenticated, "Authentication Required!")
      );
    }
    if (!chatUserId) {
      return next(createHttpError(ErrorCodes.not_found, "User ID Required!"));
    }

    let usersData: string[] | null = await redisClient.sMembers(userModel);

    if (!usersData) {
      throw new Error("No User Found!");
    }

    let currentUser: UserInterface | null = null;
    let chatUser: UserInterface | null = null;

    usersData.map((userItem) => {
      let userInUnknownFormat: unknown = JSON.parse(userItem) as unknown;
      let userInRequiredFormat: UserInterface =
        userInUnknownFormat as UserInterface;
      if (userInRequiredFormat.id === userId) {
        currentUser = userInRequiredFormat;
      }
      if (userInRequiredFormat.id === chatUserId) {
        chatUser = userInRequiredFormat;
      }
    });

    if (!currentUser) {
      return next(
        createHttpError(ErrorCodes.unauthorized, "Invalid Auth Credentials!")
      );
    }
    if (!chatUser) {
      return next(createHttpError(ErrorCodes.not_found, "User Not Found!"));
    }

    res.json({ status: true, data: chatUser });
    return;
  } catch (e) {
    let message = "Some Error Occured";
    if (e instanceof Error) {
      message = e.message;
    }
    return next(createHttpError(ErrorCodes.server_error, message));
  }
};

export { getUser, userAuth };
