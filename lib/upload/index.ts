import * as cloudinaryUploader from '@/lib/cloudinary/upload';
import * as firebaseUploader from '@/lib/firebase/storage';
import { isCloudinaryConfigured } from '@/lib/cloudinary/config';
import { resolveApiUrl } from '@/lib/utils';

// Define upload service types
type UploadService = 'cloudinary' | 'firebase';

// Flag to control which service to use as primary
const PRIMARY_UPLOAD_SERVICE = 'firebase' as const;

/**
 * Check if the service is Cloudinary
 */
function isCloudinary(service: string): boolean {
  return service === 'cloudinary';
}

/**
 * Check if the service is Firebase
 */
function isFirebase(service: string): boolean {
  return service === 'firebase';
}

/**
 * Unified interface for uploading product images
 * Will try the primary service first, then fall back to the secondary if it fails
 */
export const uploadProductImage = async (file: File, vendorId: string): Promise<{
  success: boolean;
  url?: string;
  public_id?: string; // For Cloudinary
  path?: string;      // For Firebase
  error?: any;
  errorCode?: string;
  errorMessage?: string;
  provider: UploadService;
}> => {
  console.log(`Attempting to upload using ${PRIMARY_UPLOAD_SERVICE} as primary service`);
  
  try {
    // First try the server-side API endpoint to avoid CORS issues
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorId', vendorId);
      
      // Use our unified API endpoint
      const apiUrl = resolveApiUrl('/api/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          url: result.url,
          public_id: result.public_id,
          path: result.path,
          provider: (result.provider as UploadService) || PRIMARY_UPLOAD_SERVICE as UploadService
        };
      }
    } catch (apiError) {
      console.error('Server-side upload failed, falling back to client-side methods:', apiError);
    }
    
    // If server-side API fails, fall back to client-side methods
    // Try primary service first based on configuration
    const useCloudinaryFirst = isCloudinary(PRIMARY_UPLOAD_SERVICE) && isCloudinaryConfigured();
    
    if (useCloudinaryFirst) {
      const result = await cloudinaryUploader.uploadProductImage(file, vendorId);
      
      if (result.success) {
        return {
          ...result,
          provider: 'cloudinary' as UploadService
        };
      }
      
      // If Cloudinary failed, try Firebase
      console.log('Cloudinary upload failed, falling back to Firebase Storage');
    }
    
    // Try Firebase Storage
    const firebaseResult = await firebaseUploader.uploadProductImage(file, vendorId);
    
    if (firebaseResult.success) {
      return {
        ...firebaseResult,
        public_id: firebaseResult.path, // Use path as public_id for compatibility
        provider: 'firebase' as UploadService
      };
    }
    
    // If Firebase failed (or was primary) and Cloudinary is configured, try it as fallback
    const useCloudinaryFallback = !useCloudinaryFirst && isCloudinaryConfigured();
    
    if (useCloudinaryFallback) {
      console.log('Firebase upload failed, falling back to Cloudinary');
      const cloudinaryResult = await cloudinaryUploader.uploadProductImage(file, vendorId);
      
      if (cloudinaryResult.success) {
        return {
          ...cloudinaryResult,
          provider: 'cloudinary' as UploadService
        };
      }
    }
    
    // If both failed, return the error from the primary service
    return {
      success: false,
      errorCode: 'upload_failed',
      errorMessage: 'Failed to upload image with both services',
      provider: PRIMARY_UPLOAD_SERVICE as UploadService
    };
  } catch (error: any) {
    console.error('Error in unified upload service:', error);
    return {
      success: false,
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during upload',
      provider: PRIMARY_UPLOAD_SERVICE as UploadService
    };
  }
};

/**
 * Unified interface for uploading images from URLs
 * Will try the primary service first, then fall back to the secondary if it fails
 */
export const uploadImageFromUrl = async (imageUrl: string, vendorId: string): Promise<{
  success: boolean;
  url?: string;
  public_id?: string; // For Cloudinary
  path?: string;      // For Firebase
  error?: any;
  errorCode?: string;
  errorMessage?: string;
  provider: UploadService;
}> => {
  console.log(`Attempting to upload from URL using ${PRIMARY_UPLOAD_SERVICE} as primary service`);
  
  try {
    // First try the server-side API endpoint to avoid CORS issues
    try {
      console.log("Attempting server-side URL upload...");
      
      // Use our unified API endpoint for URL uploads
      const apiUrl = resolveApiUrl('/api/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl, vendorId })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log("Server-side URL upload successful");
        return {
          success: true,
          url: result.url,
          public_id: result.public_id,
          path: result.path,
          provider: (result.provider as UploadService) || PRIMARY_UPLOAD_SERVICE as UploadService
        };
      } else {
        console.error("Server-side URL upload failed with error:", result.error);
        throw new Error(result.error || "Server-side URL upload failed");
      }
    } catch (apiError) {
      console.error('Server-side URL upload failed, falling back to client-side methods:', apiError);
    }
    
    // If server-side API fails, fall back to client-side methods
    // Try primary service first based on configuration
    const useCloudinaryFirst = isCloudinary(PRIMARY_UPLOAD_SERVICE) && isCloudinaryConfigured();
    
    if (useCloudinaryFirst) {
      const result = await cloudinaryUploader.uploadImageFromUrl(imageUrl, vendorId);
      
      if (result.success) {
        return {
          ...result,
          provider: 'cloudinary' as UploadService
        };
      }
      
      // If Cloudinary failed, try Firebase
      console.log('Cloudinary URL upload failed, falling back to Firebase Storage');
    }
    
    // Try Firebase Storage
    const firebaseResult = await firebaseUploader.uploadImageFromUrl(imageUrl, vendorId);
    
    if (firebaseResult.success) {
      return {
        ...firebaseResult,
        public_id: firebaseResult.path, // Use path as public_id for compatibility
        provider: 'firebase' as UploadService
      };
    }
    
    // If Firebase failed (or was primary) and Cloudinary is configured, try it as fallback
    const useCloudinaryFallback = !useCloudinaryFirst && isCloudinaryConfigured();
    
    if (useCloudinaryFallback) {
      console.log('Firebase URL upload failed, falling back to Cloudinary');
      const cloudinaryResult = await cloudinaryUploader.uploadImageFromUrl(imageUrl, vendorId);
      
      if (cloudinaryResult.success) {
        return {
          ...cloudinaryResult,
          provider: 'cloudinary' as UploadService
        };
      }
    }
    
    // If all upload methods fail, use the original URL as a last resort
    console.log('All upload methods failed, using original URL as fallback');
    return {
      success: true,
      url: imageUrl,
      provider: 'direct' as UploadService,
      errorMessage: 'Using original URL as fallback due to upload failures'
    };
  } catch (error: any) {
    console.error('Error in unified URL upload service:', error);
    
    // In case of error, use the original URL as a last resort
    console.log('Error occurred, using original URL as fallback');
    return {
      success: true,
      url: imageUrl,
      provider: 'direct' as UploadService,
      errorCode: error.code || 'unknown',
      errorMessage: 'Using original URL due to upload error: ' + (error.message || 'Unknown error')
    };
  }
};

/**
 * Unified interface for uploading multiple product images
 */
export const uploadMultipleProductImages = async (
  files: File[], 
  vendorId: string,
  onProgress?: (progress: number) => void
) => {
  const results = [];
  let completedUploads = 0;
  
  try {
    // Process each file sequentially
    for (const file of files) {
      const result = await uploadProductImage(file, vendorId);
      results.push(result);
      
      // Update progress
      completedUploads++;
      if (onProgress) {
        onProgress((completedUploads / files.length) * 100);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      totalFiles: files.length,
      successfulUploads: successCount,
      failedUploads: files.length - successCount,
      results,
      provider: PRIMARY_UPLOAD_SERVICE as UploadService
    };
  } catch (error) {
    console.error("Error in batch upload:", error);
    return {
      success: false,
      totalFiles: files.length,
      successfulUploads: completedUploads,
      failedUploads: files.length - completedUploads,
      results,
      error,
      provider: PRIMARY_UPLOAD_SERVICE as UploadService
    };
  }
};

/**
 * Unified interface for deleting product images
 */
export const deleteProductImage = async (identifier: string): Promise<{
  success: boolean;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
  provider: UploadService;
}> => {
  // Determine if the identifier is a Cloudinary public_id or Firebase path
  // Cloudinary public_ids typically contain folder paths with "/"
  // Firebase paths always start with "products/"
  const isFirebasePath = identifier.startsWith('products/');
  
  try {
    if (isFirebasePath) {
      const result = await firebaseUploader.deleteProductImage(identifier);
      return {
        ...result,
        provider: 'firebase'
      };
    } else {
      // Assume it's a Cloudinary public_id
      const result = await cloudinaryUploader.deleteProductImage(identifier);
      return {
        ...result,
        provider: 'cloudinary'
      };
    }
  } catch (error: any) {
    console.error('Error in unified delete service:', error);
    return {
      success: false,
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during deletion',
      provider: isFirebasePath ? 'firebase' : 'cloudinary'
    };
  }
};

/**
 * Check if upload services are properly configured
 */
export const checkUploadConfig = async () => {
  try {
    // Check Cloudinary configuration
    const cloudinaryConfigured = isCloudinaryConfigured();
    
    // Check Firebase Storage configuration
    let firebaseConfigured = false;
    let firebaseBucketConfigured = false;
    
    try {
      // Import dynamically to avoid circular dependencies
      const { storage, isFirebaseStorageConfigured } = await import('@/lib/firebase/config');
      
      // Check if Firebase is initialized
      firebaseConfigured = !!storage;
      
      // Check if storage bucket is configured
      firebaseBucketConfigured = isFirebaseStorageConfigured();
      
      // Additional check - verify the bucket is actually set in the app options
      if (firebaseConfigured && storage.app && !storage.app.options.storageBucket) {
        console.warn('Firebase Storage is initialized but no bucket is configured');
        firebaseBucketConfigured = false;
      }
    } catch (error) {
      console.error('Error checking Firebase Storage configuration:', error);
      firebaseConfigured = false;
      firebaseBucketConfigured = false;
    }
    
    // Determine primary service based on configuration
    let primaryService: UploadService = PRIMARY_UPLOAD_SERVICE as UploadService;
    
    if (isFirebase(PRIMARY_UPLOAD_SERVICE) && !firebaseBucketConfigured && cloudinaryConfigured) {
      console.log('Firebase Storage bucket not configured, using Cloudinary as primary');
      primaryService = 'cloudinary';
    } else if (isCloudinary(PRIMARY_UPLOAD_SERVICE) && !cloudinaryConfigured && firebaseBucketConfigured) {
      console.log('Cloudinary not configured, using Firebase as primary');
      primaryService = 'firebase';
    }
    
    return {
      cloudinary: {
        configured: cloudinaryConfigured
      },
      firebase: {
        configured: firebaseConfigured,
        bucketConfigured: firebaseBucketConfigured
      },
      primaryService,
      anyServiceConfigured: cloudinaryConfigured || firebaseBucketConfigured
    };
  } catch (error) {
    console.error('Error checking upload configuration:', error);
    return {
      cloudinary: { configured: false },
      firebase: { configured: false, bucketConfigured: false },
      primaryService: PRIMARY_UPLOAD_SERVICE as UploadService,
      anyServiceConfigured: false,
      error
    };
  }
}; 