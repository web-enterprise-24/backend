import express from 'express';
import { ProtectedRequest } from '../../types/app-request';
import asyncHandler from '../../helpers/asyncHandler';
import { SuccessResponse } from '../../core/ApiResponse';
import MessageRepo from '../../database/repository/MessageRepo';
import authentication from '../../auth/authentication';
import UserRepo from '../../database/repository/UserRepo';
import { BadRequestError } from '../../core/ApiError';
import schema from './schema';
import validator from '../../helpers/validator';

const router = express.Router();

router.use(authentication);

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const messages = await MessageRepo.getMessages(
      req.user.id,
      req.query.selectedUserId as string,
    );
    new SuccessResponse('Messages fetched', {
      messages,
    }).send(res);
  }),
);
router.post(
  '/',
  validator(schema.chat),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { receiverId, content } = req.body;
    const message = await MessageRepo.create(req.user.id, receiverId, content);
    new SuccessResponse('Message sent', {
      message,
    }).send(res);
  }),
);
router.get(
  '/userChat',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const actionTriggerUser = await UserRepo.findByEmail(req.user.email);
    const roleCode = actionTriggerUser?.roles[0].code;
    if (!roleCode) {
      throw new BadRequestError('Role code not found');
    }
    const userChats = await MessageRepo.getUserChats(req.user.id, roleCode);
    new SuccessResponse('User chats fetched', {
      userChats,
    }).send(res);
  }),
);
router.get(
  '/findUserChat',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userChats = await UserRepo.findPublicUser(
      req.user.id,
      req.query.search as string,
    );
    new SuccessResponse('User chats fetched', {
      userChats,
    }).send(res);
  }),
);

router.get(
  '/unreadMessages',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const unreadMessages = await MessageRepo.getUnreadMessages(req.user.id);
    new SuccessResponse('Unread messages status', { unreadMessages }).send(res);
  }),
);

export default router;
