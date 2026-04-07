/**
 * Timeout constants tuned for Dermalogica.com (Shopify + third-party scripts).
 * These are used by helper functions — Playwright's own timeouts are in playwright.config.ts.
 */
export const TIMEOUTS = {
  /** Full page load including third-party scripts (Yotpo, Searchanise, etc.) */
  pageLoad: 60_000,

  /** Lazy-loaded or dynamically injected elements */
  elementVisible: 15_000,

  /** CSS transitions, drawer open/close, modal animations */
  animation: 2_000,

  /** Wait for all XHR/fetch requests to settle */
  networkIdle: 30_000,

  /** Searchanise autocomplete/search results */
  searchResults: 10_000,

  /** Popup/modal appearance delay (newsletter, promo) */
  popupDelay: 5_000,

  /** Cart drawer or mini-cart update */
  cartUpdate: 5_000,

  /** Checkout page transitions */
  checkoutTransition: 15_000,
} as const;
