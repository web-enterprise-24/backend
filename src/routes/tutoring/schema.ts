import Joi from 'joi';

export default {
  getChat: Joi.object().keys({
    authorization: Joi.string().required(),
  }),
  allocate: Joi.object().keys({
    studentIds: Joi.array().items(Joi.string()).required(),
    tutorId: Joi.string().required(),
  }),
};
