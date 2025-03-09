import express from 'express';
import authentication from '../../auth/authentication';
// import CommentRepo from '../../database/repository/CommentRepo';

const router = express.Router();

router.use(authentication);
