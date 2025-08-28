import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to proxy image requests to bypass CORS restrictions
 * This allows fetching images from external sources that may block direct access
 */
export async function GET(request: NextRequest) {
  try {
    // Get the target URL from the query parameter
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Image proxy: Fetching image from ${targetUrl}`);
    
    // Try different user agents if the first one fails
    const userAgents = [
      // Chrome on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      // Safari on macOS
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      // Firefox on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
      // Mobile Safari on iOS
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    ];
    
    // Try with different user agents
    let response = null;
    let error = null;
    
    for (const userAgent of userAgents) {
      try {
        response = await fetch(targetUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': new URL(targetUrl).origin,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          break; // Exit the loop if successful
        }
        
        error = `Failed with status ${response.status} using user agent: ${userAgent}`;
      } catch (fetchError: any) {
        error = `Fetch error with user agent ${userAgent}: ${fetchError.message}`;
        console.error(error);
      }
    }
    
    if (!response || !response.ok) {
      console.error(`Image proxy: All attempts failed to fetch image, last error: ${error}`);
      return NextResponse.json(
        { error: `Failed to fetch image: ${error}` },
        { status: 404 }
      );
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Check if the response is actually an image
    if (!contentType.startsWith('image/')) {
      console.error(`Image proxy: Response is not an image: ${contentType}`);
      return NextResponse.json(
        { error: `Response is not an image: ${contentType}` },
        { status: 415 }
      );
    }
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*' // Allow cross-origin requests
      }
    });
  } catch (error: any) {
    console.error('Error in image proxy:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to proxy image'
      },
      { status: 500 }
    );
  }
} 