// Cloudinary configuration file
// This file contains the configuration for Cloudinary image upload service

// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default', // Use environment variable or fallback to Cloudinary's default preset
  folder: 'quick-commerce/products'
};

// Check if Cloudinary is properly configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    cloudinaryConfig.cloudName && 
    cloudinaryConfig.apiKey &&
    cloudinaryConfig.apiSecret &&
    cloudinaryConfig.uploadPreset
  );
}; 