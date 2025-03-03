import { getReceiverSocketId, io } from '../../helpers/socket';
import prisma from '../prismaClient';
import AllocateRepo from './AllocateRepo';

async function getMessages(myId: string, selectedUserId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    },
    // include: {
    //   sender: {
    //     select: {
    //       id: true,
    //       name: true,
    //       profilePicUrl: true,
    //     },
    //   },
    //   receiver: {
    //     select: {
    //       id: true,
    //       name: true,
    //       profilePicUrl: true,
    //     },
    //   },
    // },
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
  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('newMessage', newMessage);
  }
  console.log('🚀 ~ create ~ newMessage:', newMessage);
  return newMessage;
}

async function getUserChats(userId: string) {
  const getMyTutor = await AllocateRepo.getMyTutor(userId);

  return [getMyTutor];
}

export default {
  getMessages,
  create,
  getUserChats,
};
