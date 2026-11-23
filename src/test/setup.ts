import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { server, state } from './server'

let unexpectedSockets = 0

beforeAll(() => {
  server.listen({
    async onUnhandledFrame({ frame }) {
      if (frame.protocol === 'ws') unexpectedSockets++
      const message = await frame.getUnhandledMessage()
      console.error(message)
      throw new Error(message)
    },
  })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  state.reset()
  const unhandled = unexpectedSockets
  unexpectedSockets = 0
  expect(unhandled, 'Unexpected unhandled WebSocket connections').toBe(0)
})
afterAll(() => {
  server.close()
  expect(
    unexpectedSockets,
    'Unexpected WebSocket connections after teardown',
  ).toBe(0)
})
