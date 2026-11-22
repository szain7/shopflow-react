import { setupWorker } from 'msw/browser'
import { createHandlers } from './handlers'
import { createMockState } from './state'

export const worker = setupWorker(
  ...createHandlers(createMockState(window.sessionStorage)),
)
