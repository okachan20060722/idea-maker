export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // If the response is OK, return it
      if (response.ok) {
        return response;
      }
      
      // If it's a 429 Too Many Requests or 503/504, we retry
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      // For other client errors (400, 401, etc.), do not retry
      return response;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, retries - 1) * 1000 + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
