import express from 'express';
import { SuccessResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
import { NotFoundError } from '../../core/ApiError';
import BlogRepo from '../../database/repository/BlogRepo';
import writer from './writer';
import editor from './editor';
import BlogCache from '../../cache/repository/BlogCache';

const router = express.Router();

router.use('/writer', writer);
router.use('/editor', editor);

router.get(
  '/url',
  validator(schema.blogUrl, ValidationSource.QUERY),
  asyncHandler(async (req, res) => {
    const blogUrl = req.query.endpoint as string;
    let blog = await BlogCache.fetchByUrl(blogUrl);

    if (!blog) {
      blog = await BlogRepo.findPublishedByUrl(blogUrl);
      if (blog) await BlogCache.save(blog);
    }

    if (!blog) throw new NotFoundError('Blog not found');
    return new SuccessResponse('success', blog).send(res);
  }),
);

router.get(
  '/id/:id',
  validator(schema.blogId, ValidationSource.PARAM),
  asyncHandler(async (req, res) => {
    let blog = await BlogCache.fetchById(req.params.id);
    console.log('🚀 ~ asyncHandler ~ blog:', blog);

    if (!blog) {
      blog = await BlogRepo.findInfoForPublishedById(req.params.id);
      if (blog) await BlogCache.save(blog);
    }

    if (!blog) throw new NotFoundError('Blog not found');
    return new SuccessResponse('success', blog).send(res);
  }),
);

export default router;
