import { useCallback } from 'react'
import { type RunResponse } from '@/types/playground'

/**
 * Processes a single JSON chunk by passing it to the provided callback.
 * @param chunk - A parsed JSON object of type RunResponse.
 * @param onChunk - Callback to handle the chunk.
 */
function processChunk(
  chunk: RunResponse,
  onChunk: (chunk: RunResponse) => void
) {
  onChunk(chunk)
}

/**
 * Parses a string buffer to extract complete JSON objects.
 *
 * This function discards any extraneous data before the first '{', then
 * repeatedly finds and processes complete JSON objects.
 *
 * @param text - The accumulated string buffer.
 * @param onChunk - Callback to process each parsed JSON object.
 * @returns Remaining string that did not form a complete JSON object.
 */
/**
 * Extracts complete JSON objects from a buffer string **incrementally**.
 * - It allows partial JSON objects to accumulate across chunks.
 * - It ensures real-time streaming updates.
 */
function parseBuffer(
  buffer: string,
  onChunk: (chunk: RunResponse) => void
): string {
  let jsonStartIndex = buffer.indexOf('{')
  let jsonEndIndex = -1

  while (jsonStartIndex !== -1) {
    let braceCount = 0
    let inString = false

    // Iterate through the buffer to find the end of the JSON object
    for (let i = jsonStartIndex; i < buffer.length; i++) {
      const char = buffer[i]

      // Check if the character is a double quote and the previous character is not a backslash
      // This is to handle escaped quotes in JSON strings
      if (char === '"' && buffer[i - 1] !== '\\') {
        inString = !inString
      }

      // If the character is not inside a string, count the braces
      if (!inString) {
        if (char === '{') braceCount++
        if (char === '}') braceCount--
      }

      // If the brace count is 0, we have found the end of the JSON object
      if (braceCount === 0) {
        jsonEndIndex = i
        break
      }
    }

    // If we found a complete JSON object, process it
    if (jsonEndIndex !== -1) {
      const jsonString = buffer.slice(jsonStartIndex, jsonEndIndex + 1)
      try {
        const parsed = JSON.parse(jsonString) as RunResponse
        processChunk(parsed, onChunk)
      } catch {
        // Skip invalid JSON, continue accumulating
        break
      }
      buffer = buffer.slice(jsonEndIndex + 1).trim()
      jsonStartIndex = buffer.indexOf('{')
      jsonEndIndex = -1
    } else {
      // No complete JSON found, wait for the next chunk
      break
    }
  }

  return buffer
}

/**
 * Custom React hook to handle streaming API responses as JSON objects.
 *
 * This hook:
 * - Accumulates partial JSON data from streaming responses.
 * - Extracts complete JSON objects and processes them via onChunk.
 * - Handles errors via onError and signals completion with onComplete.
 *
 * @returns An object containing the streamResponse function.
 */
export default function useAIResponseStream() {
  const streamResponse = useCallback(
    async (options: {
      apiUrl: string
      headers?: Record<string, string>
      requestBody: FormData | Record<string, unknown>
      onChunk: (chunk: RunResponse) => void
      onError: (error: Error) => void
      onComplete: () => void
    }): Promise<void> => {
      const {
        apiUrl,
        headers = {},
        requestBody,
        onChunk,
        onError,
        onComplete
      } = options

      // Buffer to accumulate partial JSON data.
      let buffer = ''

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            // Set content-type only for non-FormData requests.
            ...(!(requestBody instanceof FormData) && {
              'Content-Type': 'application/json'
            }),
            ...headers
          },
          body:
            requestBody instanceof FormData
              ? requestBody
              : JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw errorData
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        // Recursively process the stream.
        const processStream = async (): Promise<void> => {
          const { done, value } = await reader.read()
          if (done) {
            // Process any final data in the buffer.
            buffer = parseBuffer(buffer, onChunk)
            onComplete()
            return
          }
          // Decode, sanitize, and accumulate the chunk
          buffer += decoder.decode(value, { stream: true })

          // Parse any complete JSON objects available in the buffer.
          buffer = parseBuffer(buffer, onChunk)
          await processStream()
        }
        await processStream()
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'detail' in error) {
          onError(new Error(String(error.detail)))
        } else {
          onError(new Error(String(error)))
        }
      }
    },
    []
  )

  return { streamResponse }
}
