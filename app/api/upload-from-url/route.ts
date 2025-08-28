import { NextRequest, NextResponse } from 'next/server';
import { uploadImageFromUrl } from '@/lib/upload';

/**
 * API endpoint for uploading images from URLs
 * This endpoint uses our unified upload service that supports both Cloudinary and Firebase
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { imageUrl, vendorId } = body;
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }
    
    // Use our unified upload service
    const result = await uploadImageFromUrl(imageUrl, vendorId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.url,
        public_id: result.public_id,
        path: result.path,
        provider: result.provider
      });
    } else {
      throw new Error(result.errorMessage || 'Failed to upload image from URL');
    }
  } catch (error: any) {
    console.error('Error in upload-from-url API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process request'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 