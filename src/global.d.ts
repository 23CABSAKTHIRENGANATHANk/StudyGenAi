declare global {
  interface Window {
    __studygen_refresh_interval?: ReturnType<typeof setInterval>
  }
}
