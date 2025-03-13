import prisma from '../prismaClient';
import { Comment } from '@prisma/client';

async function create(
  userId: string,
  message: string,
  documentId: string,
  parentId?: string,
): Promise<Comment> {
  return prisma.comment.create({
    data: {
      message,
      documentId,
      userId,
      parentId: parentId ?? null,
    },
  });
}

async function deleteComment(userId: string, commentId: string) {
  return await prisma.comment.delete({
    where: { id: commentId, userId },
  });
}

async function updateComment(
  userId: string,
  commentId: string,
  message: string,
) {
  return await prisma.comment.update({
    where: { id: commentId, userId },
    data: { message },
  });
}

export default {
  create,
  deleteComment,
  updateComment,
};
