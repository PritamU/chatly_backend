const generateMessageModel = (iUserId: String, rUserId: string) => {
  return `${iUserId},${rUserId}`;
};

export { generateMessageModel };
