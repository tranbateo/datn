import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

async function proxyRequest(request: NextRequest, pathArray: string[]) {
  const path = pathArray.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  const url = `${BACKEND_URL}/${path}${queryString}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  const headers = new Headers(request.headers);
  // Forward authorization if available in cookie
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Clean headers to prevent Next.js from overwriting host, connection, etc.
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const options: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    redirect: 'manual',
    duplex: 'half'
  };

  // Only pass body if it's not a GET or HEAD request
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      options.body = await request.formData();
    } else {
      const bodyText = await request.text();
      if (bodyText) {
        options.body = bodyText;
      }
    }
  }

  try {
    const response = await fetch(url, options as RequestInit);
    
    // Convert backend response to Next.js response
    const responseBody = await response.arrayBuffer();
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ message: 'Internal Proxy Error', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
