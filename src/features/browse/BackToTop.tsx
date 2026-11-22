import { useScrollThreshold } from '../../hooks/useScrollThreshold'
import { actionClass } from './BrowseMessage'

export function BackToTop() {
  const visible = useScrollThreshold(500)
  if (!visible) return null

  return (
    <button
      type="button"
      className={`${actionClass} fixed right-4 bottom-4 shadow-md sm:right-8 sm:bottom-8`}
      onClick={() => {
        document.getElementById('main-content')?.focus({ preventScroll: true })
        window.scrollTo({ top: 0, behavior: 'instant' })
      }}
    >
      Back to top
    </button>
  )
}
