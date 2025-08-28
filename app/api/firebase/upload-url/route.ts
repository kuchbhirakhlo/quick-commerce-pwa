import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { resolveApiUrl } from '@/lib/utils';

/**
 * Check if a URL is directly accessible
 */
async function isUrlDirectlyAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('URL accessibility check failed:', error);
    return false;
  }
}

/**
 * API endpoint for uploading images from URLs to Firebase Storage
 * This server-side endpoint bypasses CORS issues that occur in client-side uploads
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Server-side Firebase URL upload: Starting process');
    
    // Parse the request body as JSON
    const body = await request.json();
    const imageUrl = body.imageUrl;
    const vendorId = body.vendorId;
    
    console.log(`Server-side Firebase URL upload: Received URL ${imageUrl} for vendor ${vendorId}`);
    
    if (!imageUrl || !vendorId) {
      console.error('Server-side Firebase URL upload: Missing required parameters');
      return NextResponse.json(
        { error: 'Image URL and vendorId are required' },
        { status: 400 }
      );
    }
    
    // Check if Firebase storage is initialized
    if (!storage) {
      console.error('Server-side Firebase URL upload: Firebase storage is not initialized');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Firebase storage is not initialized. Check your Firebase configuration.' 
        },
        { status: 200 }
      );
    }
    
    // Check Firebase storage bucket
    const bucket = storage.app.options.storageBucket;
    if (!bucket) {
      console.error('Server-side Firebase URL upload: No storage bucket configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase storage bucket is not configured. Check your Firebase configuration.'
        },
        { status: 200 }
      );
    }
    
    console.log(`Server-side Firebase URL upload: Using bucket ${bucket}`);
    
    // Check if URL is directly accessible
    const isAccessible = await isUrlDirectlyAccessible(imageUrl);
    
    // Determine the URL to fetch from (direct or via proxy)
    let fetchUrl = imageUrl;
    if (!isAccessible) {
      console.log('URL is not directly accessible, using proxy');
      const proxyUrl = resolveApiUrl(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`, request.url);
      fetchUrl = proxyUrl;
    }
    
    // Fetch the image from the URL
    console.log(`Server-side Firebase URL upload: Fetching image from ${isAccessible ? 'direct URL' : 'proxy'}`);
    let response;
    try {
      response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
    } catch (fetchError: any) {
      console.error('Server-side Firebase URL upload: Failed to fetch image', fetchError);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch image from URL: ${fetchError.message || 'Unknown error'}`,
      }, { status: 200 });
    }
    
    // Convert the image to a buffer
    console.log('Server-side Firebase URL upload: Converting image to buffer');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get content type from response or default to image/jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Generate a safe filename
    const timestamp = Date.now();
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `products/${vendorId}/${timestamp}_from_url.${fileExtension}`;
    console.log(`Server-side Firebase URL upload: Generated filename: ${fileName}`);
    
    // Create a reference to Firebase Storage
    const storageRef = ref(storage, fileName);
    
    // Set metadata
    const metadata = {
      contentType: contentType,
      customMetadata: {
        'vendorId': vendorId,
        'sourceUrl': imageUrl
      }
    };
    
    // Upload the file
    console.log('Server-side Firebase URL upload: Uploading file to Firebase Storage');
    try {
      await uploadBytes(storageRef, buffer, metadata);
      console.log('Server-side Firebase URL upload: File uploaded successfully');
    } catch (uploadError: any) {
      console.error('Server-side Firebase URL upload: Upload failed', uploadError);
      
      // Handle specific error cases
      if (uploadError.code === 'storage/unauthorized') {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized access to Firebase Storage. Check your Firebase rules.',
          errorCode: 'storage/unauthorized'
        }, { status: 200 });
      } else if (uploadError.code === 'storage/unknown' && uploadError.status_ === 404) {
        return NextResponse.json({
          success: false,
          error: 'Firebase Storage bucket not found. Check your Firebase configuration.',
          errorCode: 'storage/bucket-not-found'
        }, { status: 200 });
      }
      
      return NextResponse.json({
        success: false,
        error: `Upload failed: ${uploadError.message || 'Unknown error'}`,
        errorCode: uploadError.code || 'unknown',
        status: uploadError.status_ || 'unknown'
      }, { status: 200 });
    }
    
    // Get the download URL
    console.log('Server-side Firebase URL upload: Getting download URL');
    let downloadURL;
    try {
      downloadURL = await getDownloadURL(storageRef);
      console.log(`Server-side Firebase URL upload: Got download URL: ${downloadURL}`);
    } catch (urlError: any) {
      console.error('Server-side Firebase URL upload: Failed to get download URL', urlError);
      return NextResponse.json({
        success: false,
        error: `Failed to get download URL: ${urlError.message || 'Unknown error'}`,
        errorCode: urlError.code || 'unknown'
      }, { status: 200 });
    }
    
    console.log('Server-side Firebase URL upload: Process completed successfully');
    return NextResponse.json({
      success: true,
      url: downloadURL,
      path: fileName
    });
  } catch (error: any) {
    console.error('Error in server-side Firebase URL upload:', error);
    
    // Return detailed error information
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image from URL',
        errorCode: error.code || 'unknown',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 