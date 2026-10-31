import { handleClientFallback } from './clientFallback.js';

export async function apiCall<T = any>(method: string, path: string, body?: any): Promise<T> {
  try {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (netErr) {
    // Network or server endpoint not responding in static browser mode
  }

  // Resilient fallback to embedded client-safe handler
  const localRes = handleClientFallback(method, path, body);
  if (localRes.status >= 200 && localRes.status < 300) {
    return localRes.data as T;
  }
  throw new Error(localRes.data?.error || `Request failed with status ${localRes.status}`);
}
