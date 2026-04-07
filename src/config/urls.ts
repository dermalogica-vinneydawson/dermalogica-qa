/**
 * Centralized URL configuration for Dermalogica.com QA tests.
 * All paths are relative to the baseURL in playwright.config.ts.
 */
export const URLS = {
  home: '/',

  collections: {
    all: '/collections/all',
    cleansers: '/collections/cleansers',
    moisturizers: '/collections/moisturizers',
    exfoliants: '/collections/exfoliants',
    serums: '/collections/serums-and-treatments',
    sunscreen: '/collections/spf-sun-protection',
    bestSellers: '/collections/best-sellers',
    newArrivals: '/collections/new',
  },

  products: {
    // Flagship product — most likely to remain stable
    dailyMicrofoliant: '/products/daily-microfoliant',
    // Popular products for variant/pricing tests
    specialClearingBooster: '/products/special-clearing-booster',
    moisturizer: '/products/skin-smoothing-cream',
    sunscreen: '/products/invisible-physical-defense-spf30',
  },

  cart: '/cart',

  account: {
    login: '/account/login',
    register: '/account/register',
  },

  content: {
    blog: '/blogs/blog',
    aboutUs: '/pages/about-us',
    contactUs: '/pages/contact-us',
    privacyPolicy: '/policies/privacy-policy',
    termsOfService: '/policies/terms-of-service',
    shippingPolicy: '/policies/shipping-policy',
    refundPolicy: '/policies/refund-policy',
  },

  search: '/search',

  // Non-existent page for 404 testing
  notFound: '/this-page-does-not-exist-qa-test',

  // External references
  sitemap: '/sitemap.xml',
  robots: '/robots.txt',
} as const;
