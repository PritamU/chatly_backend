interface UserInterface {
  id: string;
  name: string;
  isOnline: boolean;
  unreadMessages: string[];
  currentSocketId: string;
}

interface MessageInterface {
  id: string;
  message: string;
  initiatorUserId: string;
  sender: string;
  receiver: string;
  createdAt: Date;
}

const userModel = "users";
const messageModel = "messages";

export { MessageInterface, messageModel, UserInterface, userModel };
