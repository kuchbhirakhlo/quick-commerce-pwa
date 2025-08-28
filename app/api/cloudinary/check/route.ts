import { NextResponse } from 'next/server';
import { cloudinaryConfig, isCloudinaryConfigured } from '@/lib/cloudinary/config';

export async function GET() {
  try {
    const configured = isCloudinaryConfigured();
    
    return NextResponse.json({
      success: true,
      configured,
      cloudName: cloudinaryConfig.cloudName ? true : false,
      apiKey: cloudinaryConfig.apiKey ? true : false,
      apiSecret: cloudinaryConfig.apiSecret ? true : false,
    });
  } catch (error: any) {
    console.error('Error checking Cloudinary configuration:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 