import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { stockSocketUrl, subscribeToStock } from '../api/stock-feed'

export function useLiveStock(enabled: boolean) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    return subscribeToStock(stockSocketUrl(location.origin), () => {
      // Stock can change list membership and page counts, as well as detail data.
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    })
  }, [enabled, queryClient])
}
