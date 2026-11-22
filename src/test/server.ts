import { setupServer } from 'msw/node'
import { createHandlers } from '../mocks/handlers'
import { createMockState } from '../mocks/state'

export const state = createMockState()
export const server = setupServer(...createHandlers(state))
