import { createConsumer } from '@rails/actioncable'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/cable'

let consumer: ReturnType<typeof createConsumer> | null = null

export const getConsumer = (token?: string) => {
  // Get token from localStorage if not provided
  const authToken = token || localStorage.getItem('token')
  
  // Reuse consumer if token hasn't changed
  if (consumer && authToken) {
    return consumer
  }
  
  // Disconnect old consumer if exists
  if (consumer) {
    consumer.disconnect()
  }
  
  // For ActionCable, we can pass token in URL query string
  // Using query string for compatibility with both local and ngrok
  const url = authToken ? `${WS_URL}?token=${encodeURIComponent(authToken)}` : WS_URL
  
  consumer = createConsumer(url)
  return consumer
}

export const disconnectConsumer = () => {
  if (consumer) {
    consumer.disconnect()
    consumer = null
  }
}

export const createSubscription = (
  channel: string,
  params: Record<string, any>,
  callbacks: {
    connected?: () => void
    disconnected?: () => void
    received?: (data: any) => void
  }
) => {
  const token = params.token || localStorage.getItem('token')
  const cable = getConsumer(token)
  
  // Remove token from params as it's passed in URL
  const { token: _, ...channelParams } = params
  
  return cable.subscriptions.create(
    { channel, ...channelParams },
    {
      connected() {
        console.log(`✅ Connected to ${channel}`, channelParams)
        callbacks.connected?.()
      },
      disconnected() {
        console.log(`❌ Disconnected from ${channel}`)
        callbacks.disconnected?.()
      },
      received(data: any) {
        callbacks.received?.(data)
      },
      rejected() {
        console.error(`❌ Subscription rejected for ${channel}`)
      },
    }
  )
}
