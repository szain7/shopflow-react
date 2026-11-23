import { setupServer } from 'msw/node'
import { ws } from 'msw/ws'
import { stockFeedPath } from '../api/stock-feed'
import { createHandlers } from '../mocks/handlers'
import { createMockState } from '../mocks/state'

export const state = createMockState()

// Scenario tests exercise REST independently of simulated stock ticks.
const stockFeed = ws.link(`*${stockFeedPath}`)
export const server = setupServer(
  ...createHandlers(state),
  stockFeed.addEventListener('connection', () => undefined),
)
