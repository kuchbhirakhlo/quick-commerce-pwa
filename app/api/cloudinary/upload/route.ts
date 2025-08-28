import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '@/lib/cloudinary/config';

// Configure Cloudinary with server-side credentials
cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vendorId = formData.get('vendorId') as string;
    
    if (!file || !vendorId) {
      return NextResponse.json(
        { error: 'File and vendorId are required' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a base64 string from the buffer
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;
    
    // Upload to Cloudinary using server-side SDK
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `${cloudinaryConfig.folder}/${vendorId}`,
      public_id: fileName,
      context: `vendorId=${vendorId}|originalName=${file.name}`,
      upload_preset: cloudinaryConfig.uploadPreset,
    });
    
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image'
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