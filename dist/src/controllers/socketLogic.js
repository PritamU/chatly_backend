"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserOffline = exports.handleSendMessage = exports.handleNewUser = exports.handleFetchMessages = exports.broadcastOnlineUsers = exports.broadcastMessages = void 0;
const unique_username_generator_1 = require("unique-username-generator");
const interfaces_1 = require("../config/interfaces");
const messageModelGenerator_1 = require("../utils/messageModelGenerator");
const handleNewUser = async (io, socket, redisClient, id) => {
    try {
        let users = await redisClient.sMembers(interfaces_1.userModel);
        if (!users) {
            users = [];
        }
        let userExists = false;
        let dataToAdd = "";
        let dataToRemove = "";
        users = users.map((user) => {
            let userInUnknownFormat = JSON.parse(user);
            let userInRequiredFormat = userInUnknownFormat;
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
            let name = (0, unique_username_generator_1.generateUsername)(" ");
            let count = await redisClient.sRem(interfaces_1.userModel, JSON.stringify({
                id,
                name,
                isOnline: true,
                unreadMessages: [],
                currentSocketId: socket.id,
            }));
            await redisClient.sAdd(interfaces_1.userModel, JSON.stringify({
                id,
                name,
                isOnline: true,
                unreadMessages: [],
            }));
        }
        else {
            await redisClient.sRem(interfaces_1.userModel, dataToRemove);
            await redisClient.sAdd(interfaces_1.userModel, dataToAdd);
        }
        await broadcastOnlineUsers(io, redisClient);
    }
    catch (e) {
        let message = "Error On Add User. Reason: ";
        if (e instanceof Error) {
            message = `${message}${e.message}`;
        }
        console.log(message);
    }
};
exports.handleNewUser = handleNewUser;
const handleUserOffline = async (io, redisClient, id) => {
    try {
        let usersData = await redisClient.sMembers(interfaces_1.userModel);
        if (!usersData) {
            usersData = [];
        }
        let dataToRemove = "";
        let dataToAdd = "";
        usersData.map((user) => {
            let userInUnknownFormat = JSON.parse(user);
            let userInRequiredFormat = userInUnknownFormat;
            if (userInRequiredFormat.id === id) {
                userInRequiredFormat.isOnline = false;
                dataToRemove = user;
                dataToAdd = JSON.stringify(userInRequiredFormat);
            }
        });
        if (dataToAdd && dataToRemove) {
            await redisClient.sRem(interfaces_1.userModel, dataToRemove);
            await redisClient.sAdd(interfaces_1.userModel, dataToAdd);
        }
        await broadcastOnlineUsers(io, redisClient);
    }
    catch (e) {
        let message = "Error On Remove User. Reason: ";
        if (e instanceof Error) {
            message = `${message}${e.message}`;
        }
        console.log(message);
    }
};
exports.handleUserOffline = handleUserOffline;
const handleFetchMessages = async (io, redisClient, user1, user2) => {
    try {
        const users = await redisClient.sMembers(interfaces_1.userModel);
        for (let userItem of users) {
            const userInUnknownFormat = JSON.parse(userItem);
            const userInRequiredFormat = userInUnknownFormat;
            let { unreadMessages } = userInRequiredFormat;
            userInRequiredFormat.unreadMessages = unreadMessages.filter((item) => item !== user2);
            await redisClient.sRem(interfaces_1.userModel, userItem);
            await redisClient.sAdd(interfaces_1.userModel, JSON.stringify(userInRequiredFormat));
        }
        await broadcastMessages(io, redisClient, user1, user2);
        await broadcastOnlineUsers(io, redisClient);
    }
    catch (e) {
        let message = "Error On Fetch Message. Reason: ";
        if (e instanceof Error) {
            message = `${message}${e.message}`;
        }
        console.log(message);
    }
};
exports.handleFetchMessages = handleFetchMessages;
const handleSendMessage = async (io, redisClient, sender, receiver, message) => {
    try {
        let initiatorUserId = sender;
        let messageModel = (0, messageModelGenerator_1.generateMessageModel)(sender, receiver);
        let messages = await redisClient.sMembers(messageModel);
        if (messages.length === 0) {
            messageModel = (0, messageModelGenerator_1.generateMessageModel)(receiver, sender);
            messages = await redisClient.sMembers(messageModel);
        }
        if (messages.length > 0) {
            initiatorUserId = receiver;
        }
        else {
            messageModel = (0, messageModelGenerator_1.generateMessageModel)(sender, receiver);
        }
        let newMessage = {
            createdAt: new Date(),
            id: messageModel,
            initiatorUserId,
            sender,
            receiver,
            message,
        };
        await redisClient.sAdd(messageModel, JSON.stringify(newMessage));
        let users = await redisClient.sMembers(interfaces_1.userModel);
        if (!users) {
            users = [];
        }
        let targetSocketId = "";
        for (let userItem of users) {
            let userInUnknownFormat = JSON.parse(userItem);
            let userInRequiredFormat = userInUnknownFormat;
            if (userInRequiredFormat.id === receiver) {
                if (!userInRequiredFormat.unreadMessages.includes(sender)) {
                    userInRequiredFormat.unreadMessages.push(sender);
                    await redisClient.sRem(interfaces_1.userModel, userItem);
                    await redisClient.sAdd(interfaces_1.userModel, JSON.stringify(userInRequiredFormat));
                    targetSocketId = userInRequiredFormat.currentSocketId;
                }
            }
        }
        // give message alert
        if (targetSocketId) {
            io.to(targetSocketId).emit("messageAlert", "message");
        }
        await broadcastMessages(io, redisClient, sender, receiver);
    }
    catch (e) {
        let message = "Error On Remove User. Reason: ";
        if (e instanceof Error) {
            message = `${message}${e.message}`;
        }
        console.log(message);
    }
};
exports.handleSendMessage = handleSendMessage;
// Broadcast online users to all connected clients
const broadcastOnlineUsers = async (io, redisClient) => {
    let onlineUsers = await redisClient.sMembers(interfaces_1.userModel);
    if (!onlineUsers) {
        onlineUsers = [];
    }
    let activeUsers = [];
    onlineUsers.map((user) => {
        let userInUnknownFormat = JSON.parse(user);
        let userInRequiredFormat = userInUnknownFormat;
        if (!userInRequiredFormat.isOnline) {
            return false;
        }
        activeUsers.push(userInRequiredFormat);
    });
    io.emit(interfaces_1.userModel, activeUsers);
};
exports.broadcastOnlineUsers = broadcastOnlineUsers;
// Broadcast messages to specific clients
const broadcastMessages = async (io, redisClient, user1, user2) => {
    let messageModel = (0, messageModelGenerator_1.generateMessageModel)(user1, user2);
    let messages = await redisClient.sMembers(messageModel);
    if (messages.length === 0) {
        messageModel = (0, messageModelGenerator_1.generateMessageModel)(user2, user1);
        messages = await redisClient.sMembers(messageModel);
    }
    let messageToBeSent = [];
    messages.map((message) => {
        let messageInUnknownFormat = JSON.parse(message);
        let messageInRequiredFormat = messageInUnknownFormat;
        messageToBeSent.push(messageInRequiredFormat);
    });
    messageToBeSent.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    io.emit(messageModel, messageToBeSent);
};
exports.broadcastMessages = broadcastMessages;
