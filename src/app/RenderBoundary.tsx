import { Component, createRef } from 'react'
import type { ReactNode } from 'react'
import { primaryClass } from '../components/ui/commerce'
import { reportRenderFailure } from './render-monitor'

export class RenderBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  private heading = createRef<HTMLHeadingElement>()

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    reportRenderFailure()
    this.heading.current?.focus()
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="mx-auto max-w-xl space-y-4 px-5 py-12">
        <h1
          ref={this.heading}
          tabIndex={-1}
          className="text-3xl font-bold focus-visible:outline-2 focus-visible:outline-brand"
        >
          Shopflow could not display this page
        </h1>
        <p role="alert">Try reopening the page content.</p>
        <button
          type="button"
          className={primaryClass}
          onClick={() => {
            this.setState({ failed: false }, () =>
              document.getElementById('main-content')?.focus(),
            )
          }}
        >
          Try again
        </button>
      </main>
    )
  }
}
