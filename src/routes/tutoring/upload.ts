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

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: ProtectedRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileRecord = await uploadFile(req.file, req.user.id);

    new SuccessResponse('File uploaded successfully', fileRecord).send(res);
  })
);

router.get(
  '/myDocuments',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const documents = await DocumentRepo.getMyDocuments(req.user.id);

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

