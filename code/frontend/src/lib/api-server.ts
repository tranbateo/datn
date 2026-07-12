 
import { cookies } from 'next/headers';

export async function fetchApiServer<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'API request failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Not JSON
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}
