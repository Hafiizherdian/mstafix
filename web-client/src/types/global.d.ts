export {}

declare global {
  interface Window {
    ENV?: {
      WS_URL?: string
    }
  }
}
