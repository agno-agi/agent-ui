import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import useAIResponseStream from './useAIResponseStream'

function getStreamResponse() {
  let streamResponse:
    | ReturnType<typeof useAIResponseStream>['streamResponse']
    | undefined

  function Capture() {
    streamResponse = useAIResponseStream().streamResponse
    return null
  }

  renderToStaticMarkup(createElement(Capture))
  assert.ok(streamResponse)
  return streamResponse
}

function responseFromChunks(chunks: Uint8Array[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk)
        controller.close()
      }
    })
  )
}

const encoder = new TextEncoder()
const event = { event: 'RunResponse', content: 'hello' }
const formats = {
  legacy: event,
  'wrapped object': { event: event.event, data: { content: event.content } },
  'wrapped string': {
    event: event.event,
    data: JSON.stringify({ content: event.content })
  }
}

for (const [format, payload] of Object.entries(formats)) {
  for (const fragmented of [false, true]) {
    test(`reports consumer errors for ${format}, fragmented=${fragmented}`, async (t) => {
      const encoded = encoder.encode(JSON.stringify(payload))
      const chunks = fragmented
        ? [encoded.slice(0, 12), encoded.slice(12)]
        : [encoded]
      chunks.push(encoder.encode(JSON.stringify(event)))
      t.mock.method(globalThis, 'fetch', async () => responseFromChunks(chunks))

      const received: unknown[] = []
      const errors: Error[] = []
      let completions = 0
      await getStreamResponse()({
        apiUrl: 'https://example.invalid/run',
        requestBody: {},
        onChunk: (chunk) => {
          received.push(chunk)
          throw new Error('consumer failed')
        },
        onError: (error) => errors.push(error),
        onComplete: () => completions++
      })

      assert.deepEqual(received, [event])
      assert.equal(errors.length, 1)
      assert.match(errors[0].message, /consumer failed/)
      assert.equal(completions, 0)
    })
  }
}

test('streams concatenated formats across JSON and UTF-8 boundaries', async (t) => {
  const unicodeEvent = { event: event.event, content: 'hello 🌍 {"quoted"}' }
  const encoded = encoder.encode(
    JSON.stringify(unicodeEvent) +
      JSON.stringify(formats['wrapped object']) +
      JSON.stringify(formats['wrapped string'])
  )
  const emojiStart = encoded.indexOf(0xf0)
  t.mock.method(globalThis, 'fetch', async () =>
    responseFromChunks([
      encoded.slice(0, 12),
      encoded.slice(12, emojiStart + 2),
      encoded.slice(emojiStart + 2)
    ])
  )

  const received: unknown[] = []
  const errors: Error[] = []
  let completions = 0
  await getStreamResponse()({
    apiUrl: 'https://example.invalid/run',
    requestBody: {},
    onChunk: (chunk) => received.push(chunk),
    onError: (error) => errors.push(error),
    onComplete: () => completions++
  })

  assert.deepEqual(received, [unicodeEvent, event, event])
  assert.deepEqual(errors, [])
  assert.equal(completions, 1)
})

test('continues past invalid JSON to the next valid event', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    responseFromChunks([encoder.encode('{invalid}' + JSON.stringify(event))])
  )

  const received: unknown[] = []
  const errors: Error[] = []
  let completions = 0
  await getStreamResponse()({
    apiUrl: 'https://example.invalid/run',
    requestBody: {},
    onChunk: (chunk) => received.push(chunk),
    onError: (error) => errors.push(error),
    onComplete: () => completions++
  })

  assert.deepEqual(received, [event])
  assert.deepEqual(errors, [])
  assert.equal(completions, 1)
})
