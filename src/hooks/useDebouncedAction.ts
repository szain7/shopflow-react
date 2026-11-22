import { useEffect, useEffectEvent } from 'react'

export function useDebouncedAction<T>(
  value: T,
  enabled: boolean,
  delay: number,
  action: (value: T) => void,
) {
  const run = useEffectEvent(action)

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => run(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, enabled, delay])
}
