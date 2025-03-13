import prisma from '../prismaClient';
import { Comment } from '@prisma/client';

async function createFeedback(
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

async function deleteFeedback(userId: string, commentId: string) {
  return await prisma.comment.delete({
    where: { id: commentId, userId },
  });
}

async function updateFeedback(
  userId: string,
  commentId: string,
  message: string,
) {
  return await prisma.comment.update({
    where: { id: commentId, userId },
    data: { message },
  });
}

async function createComment(
  userId: string,
  message: string,
  blogId: string,
  parentId?: string,
) {
  return prisma.comment.create({
    data: { message, blogId, userId, parentId: parentId ?? null },
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

async function deleteComment(userId: string, commentId: string) {
  return await prisma.comment.delete({ where: { id: commentId, userId } });
}

export default {
  createFeedback,
  deleteFeedback,
  updateFeedback,
  createComment,
  deleteComment,
  updateComment,
};
