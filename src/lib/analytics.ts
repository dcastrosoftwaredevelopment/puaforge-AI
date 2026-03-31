declare const __GA_MEASUREMENT_ID__: string

const GA_ID = __GA_MEASUREMENT_ID__

/** Injects the gtag script and initializes Google Analytics. Call once at app startup. */
export function initAnalytics() {
  if (!GA_ID) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false })
}

/** Track a page view */
export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: path })
}

/** Track a custom event */
export function track(event: string, params?: Record<string, string | number | boolean>) {
  if (!GA_ID || !window.gtag) return
  window.gtag('event', event, params)
}
