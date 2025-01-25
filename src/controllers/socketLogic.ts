import { RedisClientType } from "redis";
import { Server, Socket } from "socket.io";
import { generateUsername } from "unique-username-generator";
import {
  MessageInterface,
  UserInterface,
  userModel,
} from "../config/interfaces";
import { generateMessageModel } from "../utils/messageModelGenerator";

const handleNewUser = async (
  io: Server,
  socket: Socket,
  redisClient: RedisClientType,
  id: string
) => {
  try {
    let users: string[] | null = await redisClient.sMembers(userModel);
    if (!users) {
      users = [];
    }

    let userExists = false;
    let dataToAdd = "";
    let dataToRemove = "";
    users = users.map((user) => {
      let userInUnknownFormat: unknown = JSON.parse(user) as unknown;
      let userInRequiredFormat: UserInterface =
        userInUnknownFormat as UserInterface;
      if (userInRequiredFormat.id === id) {
        userExists = true;
        userInRequiredFormat.isOnline = true;
        userInRequiredFormat.currentSocketId = socket.id;
        dataToAdd = JSON.stringify(userInRequiredFormat);
        dataToRemove = user;
      }
      return user;
    });
    if (!userExists) {
      let name = generateUsername(" ");
      let count = await redisClient.sRem(
        userModel,
        JSON.stringify({
          id,
          name,
          isOnline: true,
          unreadMessages: [],
          currentSocketId: socket.id,
        })
      );
      await redisClient.sAdd(
        userModel,
        JSON.stringify({
          id,
          name,
          isOnline: true,
          unreadMessages: [],
        })
      );
    } else {
      await redisClient.sRem(userModel, dataToRemove);
      await redisClient.sAdd(userModel, dataToAdd);
    }
    await broadcastOnlineUsers(io, redisClient);
  } catch (e) {
    let message = "Error On Add User. Reason: ";
    if (e instanceof Error) {
      message = `${message}${e.message}`;
    }
    console.log(message);
  }
};

const handleUserOffline = async (
  io: Server,
  redisClient: RedisClientType,
  id: string
) => {
  try {
    let usersData: string[] | null = await redisClient.sMembers(userModel);
    if (!usersData) {
      usersData = [];
    }
    let dataToRemove = "";
    let dataToAdd = "";
    usersData.map((user) => {
      let userInUnknownFormat: unknown = JSON.parse(user) as unknown;
      let userInRequiredFormat: UserInterface =
        userInUnknownFormat as UserInterface;

      if (userInRequiredFormat.id === id) {
        userInRequiredFormat.isOnline = false;
        dataToRemove = user;
        dataToAdd = JSON.stringify(userInRequiredFormat);
      }
    });

    if (dataToAdd && dataToRemove) {
      await redisClient.sRem(userModel, dataToRemove);
      await redisClient.sAdd(userModel, dataToAdd);
    }
    await broadcastOnlineUsers(io, redisClient);
  } catch (e) {
    let message = "Error On Remove User. Reason: ";
    if (e instanceof Error) {
      message = `${message}${e.message}`;
    }
    console.log(message);
  }
};

const handleFetchMessages = async (
  io: Server,
  redisClient: RedisClientType,
  user1: string,
  user2: string
) => {
  try {
    const users: string[] = await redisClient.sMembers(userModel);
    for (let userItem of users) {
      const userInUnknownFormat: unknown = JSON.parse(userItem) as unknown;
      const userInRequiredFormat: UserInterface =
        userInUnknownFormat as UserInterface;
      let { unreadMessages } = userInRequiredFormat;
      userInRequiredFormat.unreadMessages = unreadMessages.filter(
        (item) => item !== user2
      );
      await redisClient.sRem(userModel, userItem);
      await redisClient.sAdd(userModel, JSON.stringify(userInRequiredFormat));
    }
    await broadcastMessages(io, redisClient, user1, user2);
    await broadcastOnlineUsers(io, redisClient);
  } catch (e) {
    let message = "Error On Fetch Message. Reason: ";
    if (e instanceof Error) {
      message = `${message}${e.message}`;
    }
    console.log(message);
  }
};

const handleSendMessage = async (
  io: Server,
  redisClient: RedisClientType,
  sender: string,
  receiver: string,
  message: string
) => {
  try {
    let initiatorUserId = sender;
    let messageModel = generateMessageModel(sender, receiver);
    let messages: string[] = await redisClient.sMembers(messageModel);
    if (messages.length === 0) {
      messageModel = generateMessageModel(receiver, sender);
      messages = await redisClient.sMembers(messageModel);
    }
    if (messages.length > 0) {
      initiatorUserId = receiver;
    } else {
      messageModel = generateMessageModel(sender, receiver);
    }

    let newMessage: MessageInterface = {
      createdAt: new Date(),
      id: messageModel,
      initiatorUserId,
      sender,
      receiver,
      message,
    };
    await redisClient.sAdd(messageModel, JSON.stringify(newMessage));

    let users: string[] | null = await redisClient.sMembers(userModel);

    if (!users) {
      users = [];
    }

    let targetSocketId = "";

    for (let userItem of users) {
      let userInUnknownFormat: unknown = JSON.parse(userItem) as unknown;
      let userInRequiredFormat: UserInterface =
        userInUnknownFormat as UserInterface;

      if (userInRequiredFormat.id === receiver) {
        if (!userInRequiredFormat.unreadMessages.includes(sender)) {
          userInRequiredFormat.unreadMessages.push(sender);
          await redisClient.sRem(userModel, userItem);
          await redisClient.sAdd(
            userModel,
            JSON.stringify(userInRequiredFormat)
          );
          targetSocketId = userInRequiredFormat.currentSocketId;
        }
      }
    }
    // give message alert
    if (targetSocketId) {
      io.to(targetSocketId).emit("messageAlert", "message");
    }
    await broadcastMessages(io, redisClient, sender, receiver);
  } catch (e) {
    let message = "Error On Remove User. Reason: ";
    if (e instanceof Error) {
      message = `${message}${e.message}`;
    }
    console.log(message);
  }
};

// Broadcast online users to all connected clients
const broadcastOnlineUsers = async (
  io: Server,
  redisClient: RedisClientType
) => {
  let onlineUsers: string[] | null = await redisClient.sMembers(userModel);
  if (!onlineUsers) {
    onlineUsers = [];
  }
  let activeUsers: UserInterface[] = [];
  onlineUsers.map((user) => {
    let userInUnknownFormat: unknown = JSON.parse(user) as unknown;
    let userInRequiredFormat: UserInterface =
      userInUnknownFormat as UserInterface;
    if (!userInRequiredFormat.isOnline) {
      return false;
    }
    activeUsers.push(userInRequiredFormat);
  });
  io.emit(userModel, activeUsers);
};

// Broadcast messages to specific clients
const broadcastMessages = async (
  io: Server,
  redisClient: RedisClientType,
  user1: string,
  user2: string
) => {
  let messageModel = generateMessageModel(user1, user2);
  let messages: string[] = await redisClient.sMembers(messageModel);
  if (messages.length === 0) {
    messageModel = generateMessageModel(user2, user1);
    messages = await redisClient.sMembers(messageModel);
  }

  let messageToBeSent: MessageInterface[] = [];

  messages.map((message) => {
    let messageInUnknownFormat: unknown = JSON.parse(message) as unknown;
    let messageInRequiredFormat: MessageInterface =
      messageInUnknownFormat as MessageInterface;

    messageToBeSent.push(messageInRequiredFormat);
  });
  messageToBeSent.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  io.emit(messageModel, messageToBeSent);
};

export {
  broadcastMessages,
  broadcastOnlineUsers,
  handleFetchMessages,
  handleNewUser,
  handleSendMessage,
  handleUserOffline,
};
