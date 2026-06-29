import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

const requiredCloudinaryEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const getMissingCloudinaryEnvVars = (): string[] =>
  requiredCloudinaryEnvVars.filter((key) => !process.env[key]?.trim());

const assertCloudinaryConfigured = (): void => {
  const missingVars = getMissingCloudinaryEnvVars();

  if (missingVars.length > 0) {
    throw new Error(
      `Cloudinary is not configured. Missing environment variables: ${missingVars.join(', ')}`
    );
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export const uploadImageBuffer = (
  buffer: Buffer,
  folder: string = 'homesphere/properties'
): Promise<UploadApiResponse> => {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 900, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  assertCloudinaryConfigured();
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
