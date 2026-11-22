// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'
import App from '../App'

afterEach(cleanup)

test('renders Shopflow with a keyboard-accessible skip link and a main landmark', async () => {
  const user = userEvent.setup()
  render(<App />)

  expect(
    screen.getByRole('heading', { level: 1, name: 'Shopflow' }),
  ).toBeVisible()
  const main = screen.getByRole('main')
  const skipLink = screen.getByRole('link', { name: /skip to main content/i })
  expect(skipLink).toHaveAttribute('href', `#${main.id}`)
  await user.tab()
  expect(skipLink).toHaveFocus()
})
