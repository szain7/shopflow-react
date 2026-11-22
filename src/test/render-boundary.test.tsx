// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { RenderBoundary } from '../app/RenderBoundary'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('recovers from a deliberate render failure with focus and a sanitized event', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  let fail = true
  function Content() {
    if (fail) throw new Error('sensitive-demo-value')
    return (
      <main id="main-content" tabIndex={-1}>
        <h1>Shopping restored</h1>
      </main>
    )
  }
  const user = userEvent.setup()
  render(
    <RenderBoundary>
      <Content />
    </RenderBoundary>,
    { onCaughtError: () => undefined },
  )
  expect(
    screen.getByRole('heading', { name: /could not display/ }),
  ).toHaveFocus()
  expect(screen.getByRole('alert')).toHaveTextContent('Try reopening')
  expect(log).toHaveBeenCalledExactlyOnceWith('shopflow.render_failure')
  expect(screen.queryByText('sensitive-demo-value')).not.toBeInTheDocument()
  fail = false
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(
    screen.getByRole('heading', { name: 'Shopping restored' }),
  ).toBeVisible()
  expect(screen.getByRole('main')).toHaveFocus()
})
