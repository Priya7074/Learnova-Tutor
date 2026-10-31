
import { handleClientFallback } from './clientFallback.js';

const API_BASE_URL = '';

export async function apiCall<T = any>(method: string, path: string, body?: any): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
  } catch {
    return handleFallback<T>(method, path, body);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    return handleFallback<T>(method, path, body);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

function handleFallback<T>(method: string, path: string, body?: any): T {
  const localRes = handleClientFallback(method, path, body);
  if (localRes.status >= 200 && localRes.status < 300) {
    return localRes.data as T;
  }
  throw new Error(localRes.data?.error || `Request failed with status ${localRes.status}`);
}
