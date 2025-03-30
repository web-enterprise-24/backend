import express from 'express';
import { SuccessResponse, SuccessMsgResponse } from '../../core/ApiResponse';
import { ProtectedRequest } from 'app-request';
import { BadRequestError, ForbiddenError } from '../../core/ApiError';
import BlogRepo from '../../database/repository/BlogRepo';
// import { RoleCode } from '../../database/model/Role';
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
import asyncHandler from '../../helpers/asyncHandler';
// import authentication from '../../auth/authentication';
// import authorization from '../../auth/authorization';
// import role from '../../helpers/role';
import { Blog } from '@prisma/client';
import authentication from '../../auth/authentication';

const router = express.Router();

/*-------------------------------------------------------------------------*/
// router.use(authentication, role(RoleCode.STAFF), authorization);
router.use(authentication);
/*-------------------------------------------------------------------------*/

router.post(
  '/',
  validator(schema.blogCreate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    console.log('🚀 ~ asyncHandler ~ req:', req.body);
    // req.body.blogUrl = formatEndpoint(req.body.blogUrl);

    // const blog = await BlogRepo.findUrlIfExists(req.body.blogUrl);
    // if (blog) throw new BadRequestError('Blog with this url already exists');

    const createdBlog = await BlogRepo.create({
      title: req.body.title,
      description: req.body.description,
      draftText: req.body.draftText,
      tags: req.body.tags,
      authorId: req.user.id,
      blogUrl: req.body.blogUrl,
      imgUrl: req.body.imgUrl,
      isSubmitted: true,
      contentRichText: req.body.contentRichText,
    } as Blog);

    new SuccessResponse('Blog created successfully', createdBlog).send(res);
  }),
);

router.put(
  '/id/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  validator(schema.blogUpdate),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (blog == null) throw new BadRequestError('Blog does not exists');
    if (blog.authorId !== req.user.id)
      throw new ForbiddenError("You don't have necessary permissions");
    const bodyToUpdate = {
      id: req.params.id,
      title: req.body.title,
      description: req.body.description,
      contentRichText: req.body.contentRichText,
      tags: req.body.tags,
      imgUrl: req.body.imgUrl,
    };

    console.log('🚀 ~ bodyToUpdate:', bodyToUpdate);
    const updatedBlog = await BlogRepo.update(bodyToUpdate as Blog);
    new SuccessResponse('Blog updated successfully', updatedBlog).send(res);
  }),
);

router.put(
  '/submit/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (!blog) throw new BadRequestError('Blog does not exists');
    if (blog.authorId !== req.user.id)
      throw new ForbiddenError("You don't have necessary permissions");

    blog.isSubmitted = true;
    blog.isDraft = false;

    await BlogRepo.update(blog);
    return new SuccessMsgResponse('Blog submitted successfully').send(res);
  }),
);

router.put(
  '/withdraw/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (!blog) throw new BadRequestError('Blog does not exists');
    if (blog.authorId !== req.user.id)
      throw new ForbiddenError("You don't have necessary permissions");

    blog.isSubmitted = false;
    blog.isDraft = true;

    await BlogRepo.update(blog);
    return new SuccessMsgResponse('Blog withdrawn successfully').send(res);
  }),
);

router.delete(
  '/id/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (!blog) throw new BadRequestError('Blog does not exists');
    if (blog.authorId !== req.user.id)
      throw new ForbiddenError("You don't have necessary permissions");

    const deletedBlog = await BlogRepo.deleteBlog(blog.id);
    return new SuccessResponse('Blog deleted successfully', deletedBlog).send(
      res,
    );
  }),
);

router.get(
  '/submitted/all',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blogs = await BlogRepo.findAllSubmissionsForWriter(req.user);
    return new SuccessResponse('success', blogs).send(res);
  }),
);

router.get(
  '/published/all',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blogs = await BlogRepo.findAllPublishedForWriter(req.user);
    return new SuccessResponse('success', blogs).send(res);
  }),
);

router.get(
  '/drafts/all',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blogs = await BlogRepo.findAllDraftsForWriter(req.user);
    return new SuccessResponse('success', blogs).send(res);
  }),
);

router.get(
  '/id/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const blog = await BlogRepo.findBlogAllDataById(req.params.id);
    if (!blog) throw new BadRequestError('Blog does not exists');
    if (blog.authorId !== req.user.id)
      throw new ForbiddenError("You don't have necessary permissions");
    return new SuccessResponse('success', blog).send(res);
  }),
);

export default router;
