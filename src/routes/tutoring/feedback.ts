import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import CommentRepo from '../../database/repository/CommentRepo';
import { RoleCode } from '../../database/model/Role';
import role from '../../helpers/role';
import authorization from '../../auth/authorization';
import { createNotification } from '../../database/repository/NotificationRepo';
import prisma from '../../database/prismaClient';
import { BadRequestError } from '../../core/ApiError';
// import CommentRepo from '../../database/repository/CommentRepo';

const router = express.Router();
router.use(authentication);
router.use(role(RoleCode.TUTOR, RoleCode.STUDENT));
router.use(authorization);

// router.post(
//   '/:documentId',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     const { documentId } = req.params;
//     const { message } = req.body;
//     const { parentId } = req.body;

//     const comment = await CommentRepo.create(
//       req.user.id,
//       message,
//       documentId,
//       parentId as string,
//     );
//     return new SuccessResponse('Comment created', comment).send(res);
//   }),
// );

router.post(
  '/:documentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { documentId } = req.params;
    const { message, parentId } = req.body;
    const userId = req.user.id;

    if (!message) {
      throw new BadRequestError('Message cannot be empty');
    }

    // Get student and document information
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { student: true },
    });

    if (!document) {
      throw new BadRequestError('Document not found');
    }

    // Create feedback
    const feedback = await prisma.comment.create({
      data: {
        message,
        documentId,
        userId,
        parentId: parentId ?? null,
      },
    });

    // Send notification to student
    const tutor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const tutorName = tutor?.name || tutor?.email;

    await createNotification({
      userId: document.studentId, // Student get notification
      title: 'New Feedback from Your Tutor',
      message: `Tutor ${tutorName} has left feedback on your document: ${document.fileName}`,
      type: 'feedback',
      documentId,
    });

    return new SuccessResponse('Feedback submitted', feedback).send(res);
  }),
);


router.put(
  '/:documentId/:commentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { documentId, commentId } = req.params;
    const { message } = req.body;
    const comment = await CommentRepo.updateComment(
      req.user.id,
      commentId,
      message,
    );
    return new SuccessResponse('Comment updated', comment).send(res);
  }),
);

router.delete(
  '/:documentId/:commentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { documentId, commentId } = req.params;
    await CommentRepo.deleteComment(req.user.id, commentId);
    console.log('🚀 ~ asyncHandler ~ documentId:', documentId);
    return new SuccessResponse('Comment deleted', null).send(res);
  }),
);

export default router;
