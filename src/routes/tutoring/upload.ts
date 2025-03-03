import express, { Request, Response } from 'express';
import multer from 'multer';
import authentication from '../../auth/authentication';
import asyncHandler from '../../helpers/asyncHandler';
import { ProtectedRequest } from '../../types/app-request';
import { BadRequestError } from '../../core/ApiError';
import { StoreModel } from '../../database/model/Store';
import { SuccessResponse } from '../../core/ApiResponse';
import { uploadFile } from '../../helpers/uploadFile';


const router = express.Router();

// Use authentication middleware
router.use(authentication);

// Multer configuration
const storage = multer.diskStorage({});

// File filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type. Only JPEG, PNG, GIF and PDF are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 500000 // 500KB limit
  },
  fileFilter
});

// Controller function
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: ProtectedRequest, res) => {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    try {
      // Upload file to cloudinary
      const uploadResult = await uploadFile(req.file.path);

      // Create new store record
      const store = await StoreModel.create({
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        uploadDate: new Date()
      });

      return new SuccessResponse('File uploaded successfully', store).send(res);
    } catch (error) {
      throw new BadRequestError('Error processing file upload');
    }
  })
);

export default router;
