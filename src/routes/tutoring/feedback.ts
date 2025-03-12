import express from 'express';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { SuccessResponse } from '../../core/ApiResponse';
import CommentRepo from '../../database/repository/CommentRepo';
import { RoleCode } from '../../database/model/Role';
import role from '../../helpers/role';
import authorization from '../../auth/authorization';
// import CommentRepo from '../../database/repository/CommentRepo';

const router = express.Router();
router.use(authentication);
router.use(role(RoleCode.TUTOR, RoleCode.STUDENT));
router.use(authorization);

router.post(
  '/:documentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { documentId } = req.params;
    const { message } = req.body;
    const { parentId } = req.body;

    const comment = await CommentRepo.create(
      req.user.id,
      message,
      documentId,
      parentId as string,
    );
    return new SuccessResponse('Comment created', comment).send(res);
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
