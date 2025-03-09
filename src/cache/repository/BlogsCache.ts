import { getListRange, setList } from '../query';
import { DynamicKey, getDynamicKey } from '../keys';
import { addMillisToCurrentDate } from '../../helpers/utils';
import { caching } from '../../config';
import { Blog } from '@prisma/client';

function getKeyForSimilar(blogId: string) {
  // return getDynamicKey(DynamicKey.BLOGS_SIMILAR, blogId.toHexString());
  return getDynamicKey(DynamicKey.BLOGS_SIMILAR, blogId);
}

async function saveSimilarBlogs(blogId: string, blogs: Blog[]) {
  return setList(
    getKeyForSimilar(blogId),
    blogs,
    addMillisToCurrentDate(caching.contentCacheDuration),
  );
}

async function fetchSimilarBlogs(blogId: string) {
  return getListRange<Blog>(getKeyForSimilar(blogId));
}

export default {
  saveSimilarBlogs,
  fetchSimilarBlogs,
};
