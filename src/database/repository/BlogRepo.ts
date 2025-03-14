import { Blog, User } from '@prisma/client';
import prisma from '../prismaClient';

// async function create(blog: Blog): Promise<Blog> {
//   const now = new Date();
//   blog.createdAt = now;
//   blog.updatedAt = now;
//   const createdBlog = await BlogModel.create(blog);
//   return createdBlog.toObject();
// }
async function create(blog: Blog): Promise<Blog> {
  console.log('🚀 ~ create ~ blog:', blog);
  return prisma.blog.create({ data: blog });
}

async function update(blog: Blog): Promise<Blog | null> {
  return prisma.blog.update({ where: { id: blog.id }, data: blog });
}

async function findInfoById(id: string): Promise<Blog | null> {
  return prisma.blog.findUnique({ where: { id: id, status: true } });
}

async function findInfoForPublishedById(id: string): Promise<Blog | null> {
  return prisma.blog.findUnique({
    where: { id: id, isPublished: true, status: true },
  });
}

async function findBlogAllDataById(id: string): Promise<Blog | null> {
  return prisma.blog.findUnique({
    where: { id: id, status: true },
    include: {
      author: { select: { name: true, profilePicUrl: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          message: true,
          createdAt: true,
          parentId: true,
          _count: {
            select: {
              likes: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true, profilePicUrl: true },
          },
        },
      },
    },
  });
}

async function findPublishedByUrl(blogUrl: string): Promise<Blog | null> {
  return prisma.blog.findFirst({
    where: { blogUrl: blogUrl, isPublished: true, status: true },
    include: {
      author: {
        select: {
          roles: true,
          name: true,
          profilePicUrl: true,
        },
      },
    },
  });
}

async function findUrlIfExists(blogUrl: string): Promise<Blog | null> {
  return prisma.blog.findFirst({ where: { blogUrl: blogUrl } });
}

async function findByTagAndPaginated(
  tag: string,
  pageNumber: number,
  limit: number,
): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: { tags: { has: tag }, status: true, isPublished: true },
    skip: limit * (pageNumber - 1),
    take: limit,
    include: {
      author: {
        select: { roles: true, name: true, profilePicUrl: true },
      },
    },
  });
}

async function findAllPublishedForAuthor(userId: string): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: { authorId: userId, status: true, isPublished: true },
    include: {
      author: {
        select: { name: true, profilePicUrl: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function findAllDrafts(): Promise<Blog[]> {
  return findDetailedBlogs({ isDraft: true, status: true });
}

async function findAllSubmissions(): Promise<Blog[]> {
  return findDetailedBlogs({ isSubmitted: true, status: true });
}

async function findAllPublished(): Promise<Blog[]> {
  return findDetailedBlogs({ isPublished: true, status: true });
}

async function findAllSubmissionsForWriter(user: User): Promise<Blog[]> {
  return findDetailedBlogs({ author: user, status: true, isSubmitted: true });
}

async function findAllPublishedForWriter(user: User): Promise<Blog[]> {
  return findDetailedBlogs({ author: user, status: true, isPublished: true });
}

async function findAllDraftsForWriter(user: User): Promise<Blog[]> {
  return findDetailedBlogs({ author: user, status: true, isDraft: true });
}

async function findDetailedBlogs(
  query: Record<string, unknown>,
): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: query,
    include: {
      author: { select: { name: true, profilePicUrl: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function findLatestBlogs(
  pageNumber: number,
  limit: number,
): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: { status: true, isPublished: true },
    skip: limit * (pageNumber - 1),
    take: limit,
    include: {
      author: { select: { name: true, profilePicUrl: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          message: true,
          createdAt: true,
          parentId: true,
          _count: {
            select: {
              likes: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true, profilePicUrl: true },
          },
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });
}

async function countPublishedBlogs(): Promise<number> {
  return prisma.blog.count({ where: { status: true, isPublished: true } });
}

async function searchSimilarBlogs(blog: Blog, limit: number): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: {
      title: { contains: blog.title, mode: 'insensitive' },
      status: true,
      isPublished: true,
      id: { not: blog.id },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      author: { select: { name: true, profilePicUrl: true } },
    },
  });
}
async function search(query: string, limit: number): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: {
      title: { contains: query, mode: 'insensitive' },
      status: true,
      isPublished: true,
    },
    // orderBy: {
    //   score: { $meta: 'textScore' },
    // },
    take: limit,
  });
}

async function searchLike(query: string, limit: number): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: {
      title: { contains: query, mode: 'insensitive' },
      status: true,
      isPublished: true,
    },
    take: limit,
  });
}

export default {
  create,
  update,
  findInfoById,
  findInfoForPublishedById,
  findBlogAllDataById,
  findPublishedByUrl,
  findUrlIfExists,
  findByTagAndPaginated,
  findAllPublishedForAuthor,
  findAllDrafts,
  findAllSubmissions,
  findAllPublished,
  findAllSubmissionsForWriter,
  findAllPublishedForWriter,
  findAllDraftsForWriter,
  findLatestBlogs,
  searchSimilarBlogs,
  search,
  searchLike,
  countPublishedBlogs,
};
