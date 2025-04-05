import { Platform } from 'react-native';

/**
 * Optimized parser for large JSON responses
 * Uses streaming JSON parsing when available to reduce memory usage and improve performance
 * Falls back to standard JSON.parse when streaming is not available
 */
export async function parseJsonResponse(response: Response): Promise<any> {
  // For non-streaming environments, use standard JSON parsing
  if (!response.body || typeof ReadableStream === 'undefined') {
    const text = await response.text();
    return JSON.parse(text);
  }

  // For environments that support streaming
  return new Promise((resolve, reject) => {
    try {
      const reader = response.body!.getReader();
      let buffer = '';
      let decoder = new TextDecoder();

      // Process the stream in chunks
      function processChunk({ done, value }: { done: boolean, value?: Uint8Array }): Promise<any> | any {
        if (done) {
          try {
            return resolve(JSON.parse(buffer));
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown parsing error';
            reject(new Error(`Failed to parse JSON: ${errorMessage}`));
          }
          return;
        }
        
        // Append the new chunk to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Continue reading
        return reader.read().then(processChunk);
      }
      
      // Start reading the stream
      reader.read().then(processChunk);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Function to process large arrays in chunks to avoid blocking the main thread
 * This can be used when processing large lists of channels, VOD, or series
 */
export function processArrayInChunks<T, R>(
  array: T[],
  processItem: (item: T) => R,
  chunkSize: number = 100,
  delayBetweenChunks: number = 0
): Promise<R[]> {
  return new Promise((resolve) => {
    const result: R[] = [];
    let index = 0;
    
    function processNextChunk() {
      const chunk = array.slice(index, index + chunkSize);
      index += chunkSize;
      
      chunk.forEach(item => {
        result.push(processItem(item));
      });
      
      if (index < array.length) {
        // Schedule the next chunk with a small delay to allow UI updates
        setTimeout(processNextChunk, delayBetweenChunks);
      } else {
        // All done
        resolve(result);
      }
    }
    
    // Start processing
    processNextChunk();
  });
}

/**
 * Optimized fetch function that automatically applies our parsing and error handling
 */
export async function optimizedFetch(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  
  return parseJsonResponse(response);
} 