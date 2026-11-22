import { afterAll, afterEach, beforeAll } from 'vitest'
import { server, state } from './server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  state.reset()
})
afterAll(() => server.close())
