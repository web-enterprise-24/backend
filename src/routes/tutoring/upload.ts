import express from 'express';
import multer from 'multer';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import DocumentRepo, { uploadFile } from '../../database/repository/DocumentRepo';
import { SuccessResponse } from '../../core/ApiResponse';
import UserRepo from '../../database/repository/UserRepo';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authentication);

// router.post('/', 
//   upload.single('file'), 
//   asyncHandler(async (req: ProtectedRequest, res) => {
    
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   // Upload file to cloudinary
//   const result = await cloudinary.uploader.upload(req.file.path, {
//     resource_type: 'auto', // Automatically detect file type
//     folder: 'user_uploads',
//     public_id: req.file.originalname, // Use original file name as public_id
//     // pulic_id: req.user.id + '_' + req.file.originalname,
//   });

//   // Save file record to database
//   const fileRecord = await prisma.document.create({
//     data: {
//       studentId: req.user.id,
//       fileUrl: result.secure_url,
//       fileName: req.file.originalname,
//       fileType: req.file.mimetype,
//       fileSize: req.file.size,
//       createdAt: new Date(),
//     }
//   });

//   await unlink(req.file.path); // Remove temporary file

//   res.status(200).json({
//     message: 'File uploaded successfully',
//     file: fileRecord,
//   });
// }));

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: ProtectedRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileRecord = await uploadFile(req.file, req.user.id);

    // res.status(200).json({
    //   message: 'File uploaded successfully',
    //   file: fileRecord,
    // });
    new SuccessResponse('File uploaded successfully', fileRecord).send(res);
  })
);

// router.get(
//   '/myFiles',
//   asyncHandler(async (req: ProtectedRequest, res) => {
//     console.log("🚀 ~ asyncHandler ~ req.user.id:", req.user.id)
//     const documents = await DocumentRepo.getMyDocuments(req.user.id);
    
//     new SuccessResponse('My documents', documents).send(res);
//   })
// )

router.get(
  '/myDocuments',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const documents = await DocumentRepo.getMyDocuments(req.user.id);

    // if (!documents || documents.length === 0) {
    //   return new SuccessResponse('No documents found', { documents: [] }).send(res);
    // }

    // new SuccessResponse('My documents', { documents }).send(res);
    new SuccessResponse('My documents', documents).send(res);
  })
);

router.get(
  '/myStudentsDocuments',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const documents = await DocumentRepo.getMyStudentsDocuments(req.user.id);

    new SuccessResponse('My students documents', documents).send(res);
  })
);

export default router;

