import { NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary/config';
import * as crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { public_id } = await request.json();
    
    if (!public_id) {
      return NextResponse.json(
        { success: false, message: 'Missing public_id parameter' },
        { status: 400 }
      );
    }
    
    // Prepare parameters for deletion
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Generate signature
    const signatureParams = `public_id=${public_id}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signatureParams)
      .digest('hex');
    
    // Prepare request to Cloudinary
    const formData = new FormData();
    formData.append('public_id', public_id);
    formData.append('timestamp', timestamp);
    formData.append('api_key', cloudinaryConfig.apiKey);
    formData.append('signature', signature);
    
    // Make the request to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.error?.message || 'Failed to delete from Cloudinary' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error in Cloudinary delete API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 