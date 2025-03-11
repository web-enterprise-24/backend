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
  notification: Joi.object().keys({
    userId: Joi.string().uuid().required(),
    title: Joi.string().min(3).max(255).required(),
    message: Joi.string().min(5).max(500).required(),
    type: Joi.string().required(),
    documentId: Joi.string().uuid().optional(),
  }),
};
