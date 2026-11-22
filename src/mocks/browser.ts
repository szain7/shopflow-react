import { setupWorker } from 'msw/browser'
import { createHandlers } from './handlers'
import { createMockState } from './state'
import { createStockFeed } from './stock-feed'

const state = createMockState(window.sessionStorage)
export const worker = setupWorker(
  ...createHandlers(state),
  createStockFeed(state),
)
