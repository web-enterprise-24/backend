import { getJson, setJson } from '../query';
// import Blog from '../../database/model/Blog';
import { DynamicKey, getDynamicKey } from '../keys';
import { caching } from '../../config';
import { addMillisToCurrentDate } from '../../helpers/utils';
import { Blog } from '@prisma/client';

function getKeyForId(blogId: string) {
  // return getDynamicKey(DynamicKey.BLOG, blogId.toHexString());
  return getDynamicKey(DynamicKey.BLOG, blogId);
}

function getKeyForUrl(blogUrl: string) {
  return getDynamicKey(DynamicKey.BLOG, blogUrl);
}

async function save(blog: Blog) {
  return setJson(
    getKeyForId(blog.id),
    { ...blog },
    addMillisToCurrentDate(caching.contentCacheDuration),
  );
}

async function fetchById(blogId: string) {
  return getJson<Blog>(getKeyForId(blogId));
}

async function fetchByUrl(blogUrl: string) {
  return getJson<Blog>(getKeyForUrl(blogUrl));
}

export default {
  save,
  fetchById,
  fetchByUrl,
};
