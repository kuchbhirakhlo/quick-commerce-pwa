import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { isCloudinaryConfigured } from '@/lib/cloudinary/config';
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
 * API endpoint for uploading images from URLs to Cloudinary
 * This server-side endpoint bypasses CORS issues that occur in client-side uploads
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Server-side Cloudinary URL upload: Starting process');
    
    // Parse the request body as JSON
    const body = await request.json();
    const imageUrl = body.imageUrl;
    const vendorId = body.vendorId;
    
    console.log(`Server-side Cloudinary URL upload: Received URL ${imageUrl} for vendor ${vendorId}`);
    
    if (!imageUrl || !vendorId) {
      console.error('Server-side Cloudinary URL upload: Missing required parameters');
      return NextResponse.json(
        { error: 'Image URL and vendorId are required' },
        { status: 400 }
      );
    }
    
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.error('Server-side Cloudinary URL upload: Cloudinary is not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cloudinary is not configured. Check your Cloudinary configuration.' 
        },
        { status: 200 }
      );
    }
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    // Check if URL is directly accessible
    const isAccessible = await isUrlDirectlyAccessible(imageUrl);
    
    // If URL is not accessible, fetch it through our proxy first
    if (!isAccessible) {
      console.log('URL is not directly accessible, using proxy');
      
      try {
        // Fetch the image through our proxy
        const proxyUrl = resolveApiUrl(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`, request.url);
        
        // Fetch the image data
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image through proxy: ${response.statusText}`);
        }
        
        // Get the image buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Get content type
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        // Upload to Cloudinary using buffer
        console.log('Server-side Cloudinary URL upload: Uploading image from proxy buffer');
        
        // Convert buffer to base64 for Cloudinary
        const base64Image = `data:${contentType};base64,${buffer.toString('base64')}`;
        
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
          folder: `products/${vendorId}`,
          resource_type: 'auto',
          tags: ['product', `vendor_${vendorId}`],
          context: `vendor_id=${vendorId}`
        });
        
        console.log('Server-side Cloudinary URL upload: Upload successful via proxy');
        
        return NextResponse.json({
          success: true,
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        });
      } catch (proxyError: any) {
        console.error('Server-side Cloudinary URL upload: Proxy method failed', proxyError);
        return NextResponse.json({
          success: false,
          error: `Failed to upload via proxy: ${proxyError.message || 'Unknown error'}`,
          errorCode: 'proxy_failed'
        }, { status: 200 });
      }
    }
    
    // Upload image from URL to Cloudinary (direct method)
    console.log('Server-side Cloudinary URL upload: Uploading image directly');
    try {
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: `products/${vendorId}`,
        resource_type: 'auto',
        tags: ['product', `vendor_${vendorId}`],
        context: `vendor_id=${vendorId}`
      });
      
      console.log('Server-side Cloudinary URL upload: Upload successful');
      
      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      });
    } catch (uploadError: any) {
      console.error('Server-side Cloudinary URL upload: Upload failed', uploadError);
      
      return NextResponse.json({
        success: false,
        error: uploadError.message || 'Failed to upload image to Cloudinary',
        errorCode: uploadError.code || 'unknown'
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in server-side Cloudinary URL upload:', error);
    
    // Return detailed error information
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image from URL',
        errorCode: error.code || 'unknown'
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