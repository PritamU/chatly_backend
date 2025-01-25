import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { ErrorCodes } from "../constants/errorCodes";
import { generateRandomString } from "../utils/random";

const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let cookie = req.cookies["user.sid"];

    let generatedCookie = generateRandomString(16);
    if (!cookie) {
      res.cookie("user.sid", generatedCookie, {
        httpOnly: false,
        sameSite: "strict",
        path: "/",
        maxAge: 24 * 60 * 60, // 1 day in seconds
      });
    }
  } catch (e) {
    let message = "Some Error Occured";
    if (e instanceof Error) {
      message = e.message;
    }
    return next(createHttpError(ErrorCodes.server_error, message));
  } finally {
    next();
  }
};
