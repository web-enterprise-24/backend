import prisma from '../prismaClient';

async function getMessages(userId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
  console.log('🚀 ~ getMessages ~ messages:', messages);
  return messages;
}

async function create(senderId: string, receiverId: string, content: string) {
  const newMessage = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
    },
  });
  console.log('🚀 ~ create ~ newMessage:', newMessage);
  return newMessage;
}

export default {
  getMessages,
  create,
};
