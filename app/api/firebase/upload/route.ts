import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * API endpoint for uploading images to Firebase Storage
 * This server-side endpoint bypasses CORS issues that occur in client-side uploads
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Server-side Firebase upload: Starting process');
    
    // Parse the request body as FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vendorId = formData.get('vendorId') as string;
    
    console.log(`Server-side Firebase upload: Received file ${file?.name} for vendor ${vendorId}`);
    
    if (!file || !vendorId) {
      console.error('Server-side Firebase upload: Missing required parameters');
      return NextResponse.json(
        { error: 'File and vendorId are required' },
        { status: 400 }
      );
    }
    
    // Check if Firebase storage is initialized
    if (!storage) {
      console.error('Server-side Firebase upload: Firebase storage is not initialized');
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
      console.error('Server-side Firebase upload: No storage bucket configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase storage bucket is not configured. Check your Firebase configuration.'
        },
        { status: 200 }
      );
    }
    
    console.log(`Server-side Firebase upload: Using bucket ${bucket}`);
    
    // Convert file to buffer
    console.log('Server-side Firebase upload: Converting file to buffer');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate a safe filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `products/${vendorId}/${timestamp}_${safeFileName}`;
    console.log(`Server-side Firebase upload: Generated filename: ${fileName}`);
    
    // Create a reference to Firebase Storage
    const storageRef = ref(storage, fileName);
    
    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'vendorId': vendorId,
        'originalName': file.name
      }
    };
    
    // Upload the file
    console.log('Server-side Firebase upload: Uploading file to Firebase Storage');
    try {
      await uploadBytes(storageRef, buffer, metadata);
      console.log('Server-side Firebase upload: File uploaded successfully');
    } catch (uploadError: any) {
      console.error('Server-side Firebase upload: Upload failed', uploadError);
      
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
    console.log('Server-side Firebase upload: Getting download URL');
    let downloadURL;
    try {
      downloadURL = await getDownloadURL(storageRef);
      console.log(`Server-side Firebase upload: Got download URL: ${downloadURL}`);
    } catch (urlError: any) {
      console.error('Server-side Firebase upload: Failed to get download URL', urlError);
      return NextResponse.json({
        success: false,
        error: `Failed to get download URL: ${urlError.message || 'Unknown error'}`,
        errorCode: urlError.code || 'unknown'
      }, { status: 200 });
    }
    
    console.log('Server-side Firebase upload: Process completed successfully');
    return NextResponse.json({
      success: true,
      url: downloadURL,
      path: fileName
    });
  } catch (error: any) {
    console.error('Error in server-side Firebase upload:', error);
    
    // Return detailed error information
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image',
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