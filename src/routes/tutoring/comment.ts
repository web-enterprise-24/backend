import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import CommentRepo from '../../database/repository/CommentRepo';
// import CommentRepo from '../../database/repository/CommentRepo';

const router = express.Router();
router.use(authentication);

router.post(
  '/:blogId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { blogId } = req.params;
    const { message } = req.body;
    const { parentId } = req.body;

    const comment = await CommentRepo.createComment(
      req.user.id,
      message,
      blogId,
      parentId as string | undefined,
    );
    return new SuccessResponse('Comment created', comment).send(res);
  }),
);

router.put(
  '/:blogId/:commentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { blogId, commentId } = req.params;
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
  '/:blogId/:commentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { blogId, commentId } = req.params;
    await CommentRepo.deleteComment(req.user.id, commentId);
    console.log('🚀 ~ asyncHandler ~ blogId:', blogId);
    return new SuccessResponse('Comment deleted', null).send(res);
  }),
);

export default router;
