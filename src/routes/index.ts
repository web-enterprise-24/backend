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
// router.use('/blog', blog);
// router.use('/blogs', blogs);

export default router;
