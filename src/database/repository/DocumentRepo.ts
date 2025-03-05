import { unlink } from 'fs/promises';
import cloudinary from '../../helpers/cloudinary';
import prisma from '../prismaClient';
import { BadRequestError, InternalError, NotFoundError } from '../../core/ApiError';
import e from 'express';
import { Document } from '@prisma/client';
import { Allocation } from '@prisma/client';

export const uploadFile = async (file: Express.Multer.File, userId: string) => {
  if (!file) {
    throw new BadRequestError('No file uploaded');
  }

  // Check file size
  const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
  if (file.size > MAX_FILE_SIZE){
    throw new BadRequestError('File size too large. Max file size is 10MB');
  }

  // Check file type
  const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if(!ALLOWED_FILE_TYPES.includes(file.mimetype)){
    throw new BadRequestError('Invalid file type. Only Word (.doc, .docx) and PDF (.pdf) files are allowed');
  }

  // Check special characters
  const checkFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  
  // Create unique file name
  const uniqueFileName = `${userId}_${checkFileName}`;

  // Upload file to Cloudinary
  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: 'auto', // Automatically detect file type
    folder: 'user_uploads',
    public_id: uniqueFileName, // Use unique file name as public_id
  });

  // Save file record to database
  const fileRecord = await prisma.document.create({
    data: {
      studentId: userId,
      fileUrl: result.secure_url,
      fileName: checkFileName,
      fileType: file.mimetype,
      fileSize: file.size,
      createdAt: new Date(),
    }
  });

  await unlink(file.path); // Remove temporary file

  return fileRecord;
};

// async function getMyDocuments(studentId: string): Promise<Document[]> {
//   const documents = await prisma.document.findMany({
//     where: { studentId },
//     orderBy: { createdAt: 'desc' },
//   });

//   return documents;
// }

async function getMyDocuments(studentId: string): Promise<Document[]> {
  // Check if studentId is valid
  if (!studentId || typeof studentId !== "string") {
    throw new BadRequestError("Invalid student ID");
  }

  // Check if studentId exists
  const studentExists = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!studentExists) {
    throw new NotFoundError("Student not found");
  }

  try {
    // Get all documents for the student
    const documents = await prisma.document.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    // Check if documents exist
    if (documents.length === 0) {
      throw new NotFoundError("No documents found for this student");
    }

    return documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new InternalError("Something went wrong while fetching documents");
  }
}

async function getMyStudentsDocuments(tutorId: string): Promise<Document[]> {
  return await prisma.document.findMany({
    where: {
      student: {
        studentAllocations: {
          some: {tutorId},
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      student: {
        select: {
          email: true,
          name: true,
          profilePicUrl: true,
          status: true,
        },
      }
    }
  });
}


export default {
  getMyDocuments,
  getMyStudentsDocuments,
}