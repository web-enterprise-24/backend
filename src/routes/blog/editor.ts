import express from 'express';
import { SuccessResponse, SuccessMsgResponse } from '../../core/ApiResponse';
import { ProtectedRequest } from 'app-request';
import { BadRequestError, ForbiddenError } from '../../core/ApiError';
import BlogRepo from '../../database/repository/BlogRepo';
import { RoleCode } from '../../database/model/Role';
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
import asyncHandler from '../../helpers/asyncHandler';
import authentication from '../../auth/authentication';
import authorization from '../../auth/authorization';
import role from '../../helpers/role';
import { Blog } from '@prisma/client';

const router = express.Router();

/*-------------------------------------------------------------------------*/
router.use(authentication, role(RoleCode.STAFF, RoleCode.STAFF), authorization);
/*-------------------------------------------------------------------------*/

router.put(
  '/publish/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    console.log('🚀 ~ asyncHandler ~ blog:', blog);
    if (!blog) throw new BadRequestError('Blog does not exists');

    await BlogRepo.update({
      id: blog.id,
      isDraft: false,
      isSubmitted: false,
      isPublished: true,
      contentRichText: blog.draftText || '',
      publishedAt: blog.publishedAt || new Date(),
    } as Blog);
    return new SuccessMsgResponse('Blog published successfully').send(res);
  }),
);

router.put(
  '/unpublish/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (!blog) throw new BadRequestError('Blog does not exists');

    // blog.isDraft = true;
    // blog.isSubmitted = false;
    // blog.isPublished = false;

    await BlogRepo.update({
      id: blog.id,
      isDraft: true,
      isSubmitted: false,
      isPublished: false,
    } as Blog);
    return new SuccessMsgResponse('Blog unpublished successfully').send(res);
  }),
);

router.delete(
  '/id/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (!blog) throw new BadRequestError('Blog does not exists');

    blog.status = false;

    await BlogRepo.update(blog);
    return new SuccessMsgResponse('Blog deleted successfully').send(res);
  }),
);

router.get(
  '/published/all',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blogs = await BlogRepo.findAllPublished();
    return new SuccessResponse('success', blogs).send(res);
  }),
);

router.get(
  '/submitted/all',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blogs = await BlogRepo.findAllSubmissions();
    return new SuccessResponse('success', blogs).send(res);
  }),
);

router.get(
  '/drafts/all',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blogs = await BlogRepo.findAllDrafts();
    return new SuccessResponse('success', blogs).send(res);
  }),
);

router.get(
  '/id/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);

    if (!blog) throw new BadRequestError('Blog does not exists');
    if (!blog.isSubmitted && !blog.isPublished)
      throw new ForbiddenError('This blog is private');

    new SuccessResponse('success', blog).send(res);
  }),
);

export default router;
