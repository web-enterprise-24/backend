import { User } from '@prisma/client';
import { getReceiverSocketId, io } from '../../helpers/socket';
import { RoleCode } from '../model/Role';
import prisma from '../prismaClient';
import AllocateRepo from './AllocateRepo';
import UserRepo from './UserRepo';

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

async function getUserChats(userId: string, roleCode: string) {
  console.log('🚀 ~ getUserChats ~ userId:', userId);
  const listChats: User[] = [];
  const previousChats = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
  for (const chat of previousChats) {
    if (chat.senderId === userId) {
      const receiver = await UserRepo.findById(chat.receiverId);
      // check exist in listChats
      if (!listChats.some((item) => item?.id === receiver?.id)) {
        listChats.push(receiver as User);
      }
    } else {
      const sender = await UserRepo.findById(chat.senderId);
      // check exist in listChats
      if (!listChats.some((item) => item?.id === sender?.id)) {
        listChats.push(sender as User);
      }
    }
  }
  console.log('🚀 ~ getUserChats ~ previousChats:', previousChats);

  if (roleCode === RoleCode.STUDENT) {
    const getMyTutor = await AllocateRepo.getMyTutor(userId);
    if (getMyTutor && !listChats.some((item) => item?.id === getMyTutor?.id)) {
      listChats.push(getMyTutor as User);
    }
  } else if (roleCode === RoleCode.TUTOR) {
    const getMyStudents = await AllocateRepo.getMyStudent(userId);
    if (getMyStudents && getMyStudents?.length > 0) {
      const newStudents = getMyStudents.filter(
        (student) => !listChats.some((item) => item.id === student.id),
      );

      if (newStudents.length > 0) {
        listChats.push(...(newStudents as User[]));
      }
    }
  }

  return listChats;
}

export default {
  getMessages,
  create,
  getUserChats,
};
