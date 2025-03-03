import Joi from 'joi';

export default {
  allocate: Joi.object().keys({
    studentIds: Joi.array().items(Joi.string()).required(),
    tutorId: Joi.string().required(),
  }),
};
