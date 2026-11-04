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
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const options: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    redirect: 'manual',
    duplex: 'half',
  };

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

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    // Preserve real-time SSE streaming without buffering entire body
    const respContentType = response.headers.get('content-type') || '';
    if (respContentType.includes('text/event-stream') && response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      {
        message: 'Internal Proxy Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
