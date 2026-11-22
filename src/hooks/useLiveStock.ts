import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { stockFeedPath, subscribeToStock } from '../api/stock-feed'

export function useLiveStock(enabled: boolean) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    const url = new URL(stockFeedPath, location.origin)
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    return subscribeToStock(url, () => {
      // Stock can change list membership and page counts, as well as detail data.
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    })
  }, [enabled, queryClient])
}
