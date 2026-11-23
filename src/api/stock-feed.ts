import { z } from 'zod'
import { sitePath } from '../app/site-config'

export const stockFeedPath = '/mock/stock'

export function stockSocketUrl(
  origin: string,
  base = import.meta.env.BASE_URL,
) {
  const url = new URL(sitePath(stockFeedPath, base), origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url
}
export const stockUpdateSchema = z.object({
  type: z.literal('stock'),
  productId: z.string().min(1),
  stock: z.int().nonnegative(),
})

type Socket = Pick<
  WebSocket,
  'addEventListener' | 'removeEventListener' | 'close' | 'readyState'
>

export function subscribeToStock(
  url: URL,
  onRefresh: () => void,
  createSocket: (url: URL) => Socket = (address) => new WebSocket(address),
) {
  let disposed = false
  let attempt = 0
  let reconnect: ReturnType<typeof setTimeout> | undefined
  let disconnect: (() => void) | undefined

  function schedule() {
    if (disposed) return
    reconnect = setTimeout(connect, Math.min(500 * 2 ** attempt, 8_000))
    attempt++
  }

  function connect() {
    if (disposed) return
    let socket: Socket
    try {
      socket = createSocket(url)
    } catch {
      schedule()
      return
    }

    function onOpen() {
      // A new view can reuse cached data from before its previous connection.
      onRefresh()
      attempt = 0
    }

    function onMessage(event: MessageEvent<unknown>) {
      if (typeof event.data !== 'string') return
      let message: unknown
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }
      if (stockUpdateSchema.safeParse(message).success) onRefresh()
    }

    function onDisconnect() {
      detach()
      schedule()
    }

    function detach() {
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('close', onDisconnect)
      socket.removeEventListener('error', onDisconnect)
      if (socket.readyState < WebSocket.CLOSING) socket.close()
    }

    socket.addEventListener('open', onOpen)
    socket.addEventListener('message', onMessage)
    socket.addEventListener('close', onDisconnect)
    socket.addEventListener('error', onDisconnect)
    disconnect = detach
  }

  connect()
  return () => {
    disposed = true
    clearTimeout(reconnect)
    disconnect?.()
  }
}
