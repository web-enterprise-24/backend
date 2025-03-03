// const cloudinary = require("cloudinary").v2;
          
// cloudinary.config({ 
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET
// });

// const uploadFile = async(filePath) => {

//     try {
        
//         const result = await cloudinary.uploader.upload(filePath);
//         console.log(result)
//         return result;
//     } catch (error) {
//         console.log(error.message);
//     }

// }

// module.exports = {
//     uploadFile
// }

import { v2 as cloudinary } from 'cloudinary';
import { BadRequestError } from '../core/ApiError';
import fs from 'fs';

// Configure cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// interface CloudinaryResponse {
//   secure_url: string;
//   public_id: string;
//   // Add other properties you need from cloudinary response
// }
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  created_at: string;
  resource_type: string;
}

export const uploadFile = async (filePath: string): Promise<CloudinaryResponse> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestError('File not found');
    }

    // const result = await cloudinary.uploader.upload(filePath);
    // return result;
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Automatically detect file type
      folder: 'tutoring', // Optional: organize files in folders
    });

    // Clean up: remove temporary file
    fs.unlinkSync(filePath);

    return result;

  } catch (error: any) {
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw new BadRequestError(error.message || 'Error uploading file to cloudinary');
  }
};