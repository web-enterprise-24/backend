import Joi from 'joi';

export default {
  allocate: Joi.object().keys({
    studentIds: Joi.array().items(Joi.string()).required(),
    tutorId: Joi.string().required(),
  }),
  chat: Joi.object().keys({
    receiverId: Joi.string().required(),
    content: Joi.string().required(),
  }),
  acceptMeeting: Joi.object().keys({
    meetingId: Joi.string().required(),
  }),
  createMeeting: Joi.object().keys({
    start: Joi.date().required(),
    end: Joi.date().required(),
    title: Joi.string().required(),
    studentId: Joi.string().optional(),
  }),
  updateFileUrl: Joi.object().keys({
    meetingId: Joi.string().required(),
    fileUrl: Joi.string().required(),
  }),
};
