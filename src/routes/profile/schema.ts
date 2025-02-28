import Joi from 'joi';
import { JoiObjectId } from '../../helpers/validator';

export default {
  userId: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  profile: Joi.object().keys({
    name: Joi.string().min(1).max(200).optional(),
    profilePicUrl: Joi.string().uri().optional(),
    dateOfBirth: Joi.string().optional(),
    gender: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
  }),
};
