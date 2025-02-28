import Joi from 'joi';

export default {
  getChat: Joi.object().keys({
    authorization: Joi.string().required(),
  }),
};
