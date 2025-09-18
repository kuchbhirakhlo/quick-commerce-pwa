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
/**
 * Check if Cloudinary is configured for client-side unsigned uploads (requires cloudName and uploadPreset)
 */
export const isCloudinaryConfiguredForUpload = (): boolean => {
  return !!(
    cloudinaryConfig.cloudName &&
    cloudinaryConfig.uploadPreset
  );
};

/**
 * Check if Cloudinary is configured for client-initiated delete operations (requires cloudName for API URL)
 */
export const isCloudinaryConfiguredForDelete = (): boolean => {
  return !!cloudinaryConfig.cloudName;
};

/**
 * Legacy/generic check - defaults to upload configuration for client-side use
 * @deprecated Use specific functions for better error handling
 */
export const isCloudinaryConfigured = isCloudinaryConfiguredForUpload;