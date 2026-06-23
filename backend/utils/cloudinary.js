import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary using streams
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @returns {Promise<Object>}
 */
export const uploadToCloudinary = (fileBuffer, folder) => {
  console.log('>>> CLOUDINARY: uploading buffer length=', fileBuffer?.length || 0, 'folder=', folder);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
        fetch_format: "auto",
        quality: "auto",
      },
      (error, result) => {
        if (error) {
          console.log('>>> CLOUDINARY: upload error', error);
          reject(error);
        } else {
          console.log('>>> CLOUDINARY: upload success', result?.secure_url);
          resolve(result);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

export { cloudinary };
