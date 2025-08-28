import { NextRequest, NextResponse } from 'next/server';
import { isCloudinaryConfigured } from '@/lib/cloudinary/config';
import { storage } from '@/lib/firebase/config';
import { resolveApiUrl } from '@/lib/utils';

/**
 * Validate if a URL is accessible
 * @param url URL to validate
 * @returns True if URL is accessible, false otherwise
 */
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        // Add common headers to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('URL validation error:', error);
    return false;
  }
}

/**
 * API endpoint for uploading images that tries both Firebase and Cloudinary
 * This server-side endpoint bypasses CORS issues that occur in client-side uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is a file upload or URL upload
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    
    if (isFormData) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const vendorId = formData.get('vendorId') as string;
      
      if (!file || !vendorId) {
        return NextResponse.json(
          { error: 'File and vendorId are required' },
          { status: 400 }
        );
      }
      
      // Try Firebase upload first
      try {
        console.log('Trying Firebase upload in unified API endpoint');
        
        const firebaseUploadUrl = resolveApiUrl('/api/firebase/upload', request.url);
        const response = await fetch(firebaseUploadUrl, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          return NextResponse.json({
            ...result,
            provider: 'firebase'
          });
        } else {
          console.log('Firebase upload failed with error:', result.error);
        }
      } catch (firebaseError) {
        console.error('Firebase upload failed, trying Cloudinary:', firebaseError);
      }
      
      // If Firebase fails and Cloudinary is configured, try Cloudinary
      if (isCloudinaryConfigured()) {
        try {
          const cloudinaryUploadUrl = resolveApiUrl('/api/cloudinary/upload', request.url);
          const cloudinaryResponse = await fetch(cloudinaryUploadUrl, {
            method: 'POST',
            body: formData
          });
          
          const result = await cloudinaryResponse.json();
          
          if (result.success) {
            return NextResponse.json({
              ...result,
              provider: 'cloudinary'
            });
          } else {
            console.log('Cloudinary upload failed with error:', result.error);
          }
        } catch (cloudinaryError) {
          console.error('Cloudinary upload failed:', cloudinaryError);
        }
      }
    } else {
      // Handle URL upload
      try {
        const body = await request.json();
        const imageUrl = body.imageUrl;
        const vendorId = body.vendorId;
        
        if (!imageUrl || !vendorId) {
          return NextResponse.json(
            { error: 'Image URL and vendorId are required' },
            { status: 400 }
          );
        }
        
        // Validate if the URL is accessible
        console.log('Validating URL accessibility:', imageUrl);
        const isAccessible = await isUrlAccessible(imageUrl);
        
        if (!isAccessible) {
          console.log('URL is not accessible, returning direct URL with warning');
          return NextResponse.json({
            success: true,
            url: imageUrl,
            provider: 'direct',
            warning: 'URL may not be accessible for upload services'
          });
        }
        
        // Try Firebase URL upload first
        console.log('Trying Firebase URL upload in unified API endpoint');
        
        const firebaseUploadUrl = resolveApiUrl('/api/firebase/upload-url', request.url);
        const firebaseResponse = await fetch(firebaseUploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl, vendorId })
        });
        
        const firebaseResult = await firebaseResponse.json();
        
        if (firebaseResult.success) {
          return NextResponse.json({
            ...firebaseResult,
            provider: 'firebase'
          });
        } else {
          console.log('Firebase URL upload failed, trying Cloudinary');
        }
        
        // If Firebase fails and Cloudinary is configured, try Cloudinary
        if (isCloudinaryConfigured()) {
          try {
            const cloudinaryUploadUrl = resolveApiUrl('/api/cloudinary/upload-url', request.url);
            const cloudinaryResponse = await fetch(cloudinaryUploadUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ imageUrl, vendorId })
            });
            
            const cloudinaryResult = await cloudinaryResponse.json();
            
            if (cloudinaryResult.success) {
              return NextResponse.json({
                ...cloudinaryResult,
                provider: 'cloudinary'
              });
            } else {
              console.log('Cloudinary URL upload failed, using direct URL');
            }
          } catch (cloudinaryError) {
            console.error('Cloudinary URL upload failed:', cloudinaryError);
          }
        }
        
        // If both fail, return the original URL as fallback
        console.log('All upload services failed, using direct URL');
        return NextResponse.json({
          success: true,
          url: imageUrl,
          provider: 'direct',
          message: 'Using direct URL as fallback'
        });
      } catch (urlError) {
        console.error('Error processing URL upload:', urlError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to process URL upload'
          },
          { status: 200 }
        );
      }
    }
    
    // If both failed, return error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload image with any available service'
      },
      { status: 200 } // Use 200 instead of 500 to avoid network error handling
    );
  } catch (error: any) {
    console.error('Error in unified upload API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process upload request'
      },
      { status: 200 } // Use 200 instead of 500 to avoid network error handling
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 