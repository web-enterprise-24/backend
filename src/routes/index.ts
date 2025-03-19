import express from 'express';
import apikey from '../auth/apikey';
import permission from '../helpers/permission';
import signup from './access/signup';
import login from './access/login';
import logout from './access/logout';
import token from './access/token';
import credential from './access/credential';
// import blog from './blog';
// import blogs from './blogs';
export enum Permission {
  GENERAL = 'GENERAL',
}
import profile from './profile';
import roles from './roles';
import account from './access/account';
import allocate from './tutoring/allocate';
import upload from './tutoring/upload';
import chat from './tutoring/chat';
import blog from './blog';
import blogs from './blogs';
import notification from './tutoring/notification';
import feedback from './tutoring/feedback';
import comment from './tutoring/comment';
import admin from './dashboard/admin';
import student from './dashboard/student';
import tutor from './dashboard/tutor';

const router = express.Router();

/*---------------------------------------------------------*/
router.use(apikey);
/*---------------------------------------------------------*/
/*---------------------------------------------------------*/
router.use(permission(Permission.GENERAL));
/*---------------------------------------------------------*/
router.use('/signup', signup);
router.use('/login', login);
router.use('/logout', logout);
router.use('/token', token);
router.use('/credential', credential);
router.use('/profile', profile);
router.use('/roles', roles);
router.use('/account', account);
router.use('/allocate', allocate);
router.use('/upload', upload);
router.use('/chat', chat);
router.use('/blog', blog);
router.use('/blogs', blogs);
router.use('/notification', notification);
router.use('/feedback', feedback);
router.use('/comment', comment);
router.use('/admin', admin);
router.use('/student', student);
router.use('/tutor', tutor);

export default router;
