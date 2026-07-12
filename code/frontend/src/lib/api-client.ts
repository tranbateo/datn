export async function fetchApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const isServer = typeof window === 'undefined';
  // If running on server, we must provide absolute URL. 
  // However, Server Components should ideally use fetchApiServer instead.
  const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const baseUrl = isServer ? `${host}/api/proxy` : '/api/proxy';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        const text = await response.text().catch(() => '');
        if (text) errorMsg += ` - ${text.substring(0, 100)}`;
      }
      throw new Error(errorMsg);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as unknown as T;
    }

    return await response.json();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[fetchApi] Error calling ${endpoint}:`, msg);
    throw error;
  }
}

export async function fetchApiStream(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const isServer = typeof window === 'undefined';
  const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const baseUrl = isServer ? `${host}/api/proxy` : '/api/proxy';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[fetchApiStream] Error calling ${endpoint}:`, msg);
    throw error;
  }
}
