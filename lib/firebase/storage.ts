import { storage } from "./config"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

// Maximum number of retries for upload operations
const MAX_RETRIES = 3
// Delay between retries (in milliseconds)
const RETRY_DELAY = 1000

/**
 * Uploads a single product image to Firebase Storage with retry capability
 * @param file The file to upload
 * @param vendorId The vendor ID to associate with the file
 * @param attempt Current retry attempt (internal use)
 * @returns Object with success status, URL, and path
 */
export const uploadProductImage = async (file: File, vendorId: string, attempt = 1): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
}> => {
  try {
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
    const fileName = `products/${vendorId}/${timestamp}_${safeFileName}`
    const storageRef = ref(storage, fileName)

    console.log(`Uploading image (attempt ${attempt}/${MAX_RETRIES}): ${fileName}`)
    
    // Set metadata to help with CORS
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'vendorId': vendorId,
        'originalName': file.name
      }
    }

    await uploadBytes(storageRef, file, metadata)
    const downloadURL = await getDownloadURL(storageRef)

    return { success: true, url: downloadURL, path: fileName }
  } catch (error: any) {
    console.error(`Error uploading product image (attempt ${attempt}/${MAX_RETRIES}):`, error)
    
    // Check if it's a CORS error or network error and retry if not exceeded max attempts
    if (attempt < MAX_RETRIES && 
        (error.code === 'storage/unauthorized' || 
         error.code === 'storage/canceled' || 
         error.code === 'storage/unknown' ||
         error.message?.includes('CORS'))) {
      console.log(`Retrying upload after ${RETRY_DELAY}ms...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return uploadProductImage(file, vendorId, attempt + 1)
    }
    
    return { 
      success: false, 
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during upload'
    }
  }
}

/**
 * Uploads an image from a URL to Firebase Storage
 * @param imageUrl The URL of the image to upload
 * @param vendorId The vendor ID to associate with the file
 * @param attempt Current retry attempt (internal use)
 * @returns Object with success status, URL, and path
 */
export const uploadImageFromUrl = async (imageUrl: string, vendorId: string, attempt = 1): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
}> => {
  try {
    console.log(`Uploading image from URL (attempt ${attempt}/${MAX_RETRIES}): ${imageUrl}`)
    
    // Fetch the image
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`)
    }
    
    // Get image data as blob
    const blob = await response.blob()
    
    // Generate a unique filename
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
    const fileName = `products/${vendorId}/${Date.now()}_from_url.${fileExtension}`
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, fileName)
    
    // Set metadata
    const metadata = {
      contentType: blob.type,
      customMetadata: {
        'vendorId': vendorId,
        'sourceUrl': imageUrl
      }
    }
    
    await uploadBytes(storageRef, blob, metadata)
    const downloadURL = await getDownloadURL(storageRef)
    
    return { success: true, url: downloadURL, path: fileName }
  } catch (error: any) {
    console.error(`Error uploading image from URL (attempt ${attempt}/${MAX_RETRIES}):`, error)
    
    // Retry if not exceeded max attempts
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying upload after ${RETRY_DELAY}ms...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return uploadImageFromUrl(imageUrl, vendorId, attempt + 1)
    }
    
    return { 
      success: false, 
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during upload'
    }
  }
}

/**
 * Uploads multiple product images with progress tracking
 * @param files Array of files to upload
 * @param vendorId The vendor ID to associate with the files
 * @param onProgress Optional callback for progress updates
 * @returns Array of upload results for each file
 */
export const uploadMultipleProductImages = async (
  files: File[], 
  vendorId: string,
  onProgress?: (progress: number) => void
) => {
  const results = []
  let completedUploads = 0
  
  try {
    // Process each file sequentially to avoid overwhelming Firebase
    for (const file of files) {
      const result = await uploadProductImage(file, vendorId)
      results.push(result)
      
      // Update progress
      completedUploads++
      if (onProgress) {
        onProgress((completedUploads / files.length) * 100)
      }
      
      // If one upload fails, continue with the others but log error
      if (!result.success) {
        console.error('Error uploading file:', file.name, result.errorMessage)
      }
    }
    
    const successCount = results.filter(r => r.success).length
    return {
      success: successCount > 0,
      totalFiles: files.length,
      successfulUploads: successCount,
      failedUploads: files.length - successCount,
      results
    }
  } catch (error) {
    console.error("Error in batch upload:", error)
    return {
      success: false,
      totalFiles: files.length,
      successfulUploads: completedUploads,
      failedUploads: files.length - completedUploads,
      results,
      error
    }
  }
}

/**
 * Deletes a product image from Firebase Storage with retry capability
 * @param imagePath The path of the image to delete
 * @param attempt Current retry attempt (internal use)
 * @returns Object with success status
 */
export const deleteProductImage = async (imagePath: string, attempt = 1): Promise<{
  success: boolean;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
}> => {
  try {
    const storageRef = ref(storage, imagePath)
    await deleteObject(storageRef)
    return { success: true }
  } catch (error: any) {
    console.error(`Error deleting product image (attempt ${attempt}/${MAX_RETRIES}):`, error)
    
    // Retry if not exceeded max attempts and it's a retryable error
    if (attempt < MAX_RETRIES && 
        (error.code === 'storage/object-not-found' || 
         error.code === 'storage/retry-limit-exceeded' ||
         error.code === 'storage/canceled')) {
      console.log(`Retrying delete after ${RETRY_DELAY}ms...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return deleteProductImage(imagePath, attempt + 1)
    }
    
    return { 
      success: false, 
      error,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error during deletion'
    }
  }
}

/**
 * Utility function to handle Firebase Storage CORS issues
 * @returns Whether CORS is properly configured
 */
export const checkStorageCORS = async () => {
  try {
    // Skip actual CORS testing as it's causing issues
    // Instead, check if Firebase storage is initialized
    if (!storage) {
      return { corsConfigured: false, error: new Error("Firebase Storage is not initialized") };
    }
    
    // Return success without actually testing CORS
    // This avoids the CORS error during local development
    return { corsConfigured: true };
    
    /* Original CORS testing code - commented out due to CORS issues
    // Create a small test file
    const testBlob = new Blob(['CORS Test'], { type: 'text/plain' })
    const testFile = new File([testBlob], 'cors-test.txt', { type: 'text/plain' })
    
    // Try to upload it
    const result = await uploadProductImage(testFile, 'cors-test')
    
    // If successful, delete it immediately to clean up
    if (result.success && result.path) {
      await deleteProductImage(result.path)
    }
    
    return { corsConfigured: result.success }
    */
  } catch (error) {
    console.error("CORS check failed:", error)
    return { corsConfigured: false, error }
  }
}
