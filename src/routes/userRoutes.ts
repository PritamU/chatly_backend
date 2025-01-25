import express from "express";
import { getUser, userAuth } from "../controllers/userController";

const router = express.Router();

router.get("/auth", userAuth);

router.get("/get-user/:chatUserId", getUser);

export default router;
