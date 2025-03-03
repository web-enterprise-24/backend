import express from 'express';
import { ProtectedRequest } from '../../types/app-request';
import asyncHandler from '../../helpers/asyncHandler';
import { SuccessResponse } from '../../core/ApiResponse';
import MessageRepo from '../../database/repository/MessageRepo';
import authentication from '../../auth/authentication';

const router = express.Router();

router.use(authentication);

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const messages = await MessageRepo.getMessages(req.user.id);
    new SuccessResponse('Messages fetched', {
      messages,
    }).send(res);
  }),
);
router.post(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { receiverId, content } = req.body;
    await MessageRepo.create(req.user.id, receiverId, content);
    new SuccessResponse('Message sent', {
      message: 'Message sent',
    }).send(res);
  }),
);
export default router;
