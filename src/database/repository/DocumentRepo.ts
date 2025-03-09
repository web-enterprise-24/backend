import { unlink } from 'fs/promises';
import cloudinary from '../../helpers/cloudinary';
import prisma from '../prismaClient';
import {
  BadRequestError,
  InternalError,
  NotFoundError,
} from '../../core/ApiError';
import {
  BadRequestError,
  InternalError,
  NotFoundError,
} from '../../core/ApiError';
import { Document } from '@prisma/client';
import { exec } from 'child_process';
import mammoth from 'mammoth';
import nodeHtmlToImage from 'node-html-to-image';
import fs from 'fs';

export const uploadFile = async (file: Express.Multer.File, userId: string) => {
  try {
    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    // Check file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError('File size too large. Max file size is 10MB');
    }

    // Check file type
    const ALLOWED_FILE_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        'Invalid file type. Only Word (.doc, .docx) and PDF (.pdf) files are allowed',
      );
    }

    // Handle file name
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueFileName = `${userId}_${sanitizedFileName}_${Date.now()}`;

    // Upload file to Cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        folder: 'user_uploads',
        public_id: uniqueFileName,
      });
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw new BadRequestError('Failed to upload file to Cloudinary');
    }

    // Process thumbnail generation
    let thumbnailPath = '';
    let thumbnailUrl = '';

    try {
      if (file.mimetype === 'application/pdf') {
        thumbnailPath = await generatePdfThumbnail(file.path);
      } else if (file.mimetype.includes('word')) {
        thumbnailPath = await generateDocxThumbnail(file.path);
      }

      // If you have a thumbnail, upload it to Cloudinary
      if (thumbnailPath) {
        const thumbUpload = await cloudinary.uploader.upload(thumbnailPath, {
          resource_type: 'image',
          folder: 'user_uploads/thumbnails',
        });
        thumbnailUrl = thumbUpload.secure_url;
      }
    } catch (err) {
      console.error('Thumbnail generation error:', err);
    }

    // Save information file to database
    let fileRecord;
    try {
      fileRecord = await prisma.document.create({
        data: {
          studentId: userId,
          fileUrl: uploadedFile.secure_url,
          fileName: sanitizedFileName,
          fileType: file.mimetype,
          fileSize: file.size,
          thumbnailUrl,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.error('Database error:', err);
    }

    // Remove temporary file
    try {
      await unlink(file.path);
      if (thumbnailPath) {
        await unlink(thumbnailPath);
      }
    } catch (err) {
      console.warn('Temporary file cleanup error:', err);
    }

    return fileRecord;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

async function getMyDocuments(
  studentId: string,
  page: number,
  limit: number,
  baseUrl: string,
): Promise<{
  documents: Document[];
  totalPages: number;
  totalDocuments: number;
  result: number;
  nextPage?: string;
  previousPage?: string;
}> {
  const totalDocuments = await prisma.document.count({ where: { studentId } });

  const totalPages = totalDocuments > 0 ? Math.ceil(totalDocuments / limit) : 0;

  const documents = await prisma.document.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Create next & previous page links
  const nextPage =
    page < totalPages
      ? `${baseUrl}?page=${page + 1}&limit=${limit}`
      : undefined;
  const previousPage =
    page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : undefined;

  return {
    result: documents.length,
    totalPages,
    totalDocuments,
    documents,
    nextPage,
    previousPage,
  };
}

async function getMyStudentsDocuments(
  tutorId: string,
  page: number,
  limit: number,
  baseUrl: string,
): Promise<{
  documents: Document[];
  totalPages: number;
  totalDocuments: number;
  result: number;
  nextPage?: string;
  previousPage?: string;
}> {
  // Check if the tutor has any students
  const studentsAssigned = await prisma.allocation.findFirst({
    where: { tutorId },
  });

  if (!studentsAssigned) {
    return {
      result: 0,
      totalPages: 0,
      totalDocuments: 0,
      documents: [],
      nextPage: undefined,
      previousPage: undefined,
    };
  }

  // Count total of documents
  const totalDocuments = await prisma.document.count({
    where: {
      student: {
        studentAllocations: { some: { tutorId } },
      },
    },
  });

  const totalPages = totalDocuments > 0 ? Math.ceil(totalDocuments / limit) : 0;

  // Get a list of student documents that the tutor is teaching
  const documents = await prisma.document.findMany({
    where: {
      student: {
        studentAllocations: { some: { tutorId } },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      student: {
        select: { email: true, name: true, profilePicUrl: true, status: true },
      },
    },
  });

  // Create next & previous page links
  const nextPage =
    page < totalPages
      ? `${baseUrl}?page=${page + 1}&limit=${limit}`
      : undefined;
  const previousPage =
    page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : undefined;

  return {
    result: documents.length,
    totalPages,
    totalDocuments,
    documents,
    nextPage,
    previousPage,
  };
}

// Create thumbnail for pdf document
// const generatePdfThumbnail = async (filePath: string): Promise<string> => {
//   const outputPath = filePath.replace(".pdf", "_thumb.jpg");

//   return new Promise((resolve, reject) => {
//     const command = `pdftoppm -jpeg -f 1 -singlefile "${filePath}" "${outputPath.replace(".jpg", "")}"`;
//     exec(command, async (error) => {
//       if (error) {
//         reject(error);
//       } else {
//         // Resize image to smaller size for optimization
//         await sharp(outputPath).resize(300, 400).toFile(outputPath);
//         resolve(outputPath);
//       }
//     });
//   });
// };
const generatePdfThumbnail = async (filePath: string): Promise<string> => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const outputPath = filePath.replace('.pdf', '_thumb.jpg');
    const command = `pdftoppm -jpeg -f 1 -singlefile "${filePath}" "${outputPath.replace(
      '.jpg',
      '',
    )}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('pdftoppm error:', error);
          console.error('stderr:', stderr);
          reject(new Error(`pdftoppm failed: ${stderr}`));
          return;
        }

        if (!fs.existsSync(outputPath)) {
          reject(new Error('Thumbnail generation failed: File not created'));
          return;
        }

        resolve(outputPath);
      });
    });
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    throw error;
  }
};
// const execPromise = util.promisify(exec);
// const generatePdfThumbnail = async (filePath: string): Promise<string> => {
//   try {
//     const outputBase = filePath.replace('.pdf', '_thumb');
//     const outputPath = `${outputBase}.jpg`;

//     // Chạy lệnh pdftoppm để tạo ảnh JPG từ trang đầu tiên của PDF
//     await execPromise(`pdftoppm -jpeg -f 1 -singlefile "${filePath}" "${outputBase}"`);

//     // Resize ảnh để tối ưu hóa
//     await sharp(outputPath).resize(300, 400).toFile(outputPath);

//     return outputPath;
//   } catch (error) {
//     console.error('Error generating PDF thumbnail:', error);
//     throw new Error('Failed to generate PDF thumbnail');
//   }
// };

// Create thumbnail for word document (extract content and convert to image)
const generateDocxThumbnail = async (filePath: string): Promise<string> => {
  const outputPath = filePath.replace('.docx', '_thumb.png');
  const { value: textContent } = await mammoth.extractRawText({
    path: filePath,
  });
  const previewText = textContent.split('\n').slice(0, 5).join('<br>');

  await nodeHtmlToImage({
    output: outputPath,
    html: `<div style="width:400px; height:200px; font-size:16px; background:white; padding:20px;">${previewText}</div>`,
  });

  return outputPath;
};

export default {
  getMyDocuments,
  getMyStudentsDocuments,
  generatePdfThumbnail,
  generateDocxThumbnail,
};
