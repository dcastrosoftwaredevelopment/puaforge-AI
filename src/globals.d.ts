interface Window {
  dataLayer: unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gtag: (...args: any[]) => void
}
