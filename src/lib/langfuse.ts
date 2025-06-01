import { Langfuse } from 'langfuse'

let langfuseInstance: Langfuse | null = null
let langfuseInitialized: boolean = false

export const getLangfuse = (): Langfuse | null => {
  if (!langfuseInitialized) {
    const secretKey = process.env.LANGFUSE_SECRET_KEY
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY
    const baseUrl = process.env.LANGFUSE_HOST

    if (secretKey && publicKey && baseUrl) {
      try {
        langfuseInstance = new Langfuse({
          secretKey,
          publicKey,
          baseUrl,
        })
        console.log('Langfuse initialized successfully.')
      } catch (error) {
        console.error('Failed to initialize Langfuse:', error)
        console.warn(
          'Langfuse tracing will be disabled due to initialization error.'
        )
        langfuseInstance = null
      }
    } else {
      console.warn(
        'Langfuse environment variables (LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_HOST) are not fully set. Langfuse tracing will be disabled.'
      )
      langfuseInstance = null
    }
    langfuseInitialized = true
  }
  return langfuseInstance
}
