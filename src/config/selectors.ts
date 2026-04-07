/**
 * Centralized DOM selectors for Dermalogica.com.
 *
 * Dermalogica runs on Shopify. Selectors use a priority strategy:
 *   1. data-* attributes (most stable)
 *   2. Semantic HTML elements (h1, nav, main, footer)
 *   3. ARIA roles/labels
 *   4. CSS classes (least stable — Shopify theme updates may change these)
 *
 * If the site redesigns, update selectors here only — all tests reference this file.
 */
export const SELECTORS = {
  // ──────────────────────────────────────────────
  // Announcement Bar
  // ──────────────────────────────────────────────
  announcementBar: {
    container: '.announcement-bar, [data-section-type="announcement-bar"], #shopify-section-announcement-bar',
    sliderControls: '.announcement-bar__slider-btn, button[aria-label*="Next announcement"], .splide__arrow',
    thresholdMessage: '.announcement-bar__message, [data-shipping-threshold], .shipping-threshold',
  },

  // ──────────────────────────────────────────────
  // Header & Navigation
  // ──────────────────────────────────────────────
  header: {
    container: 'header, [data-section-type="header"], .header',
    logo: 'header a[href="/"], .header__heading-logo, .header-logo',
    navMenu: 'nav, .header__menu, [data-section-type="header"] nav',
    navLinks: 'nav a, .header__menu a, .header__menu-item',
    searchIcon: '[data-search-toggle], details-modal.header__search summary, .header__icon--search, button[aria-label*="Search"], a[href="/search"]',
    cartIcon: 'a[href="/cart"], [data-cart-toggle], .header__cart, button[aria-label*="Cart"]',
    cartCount: '.cart-count, .cart-count-bubble, [data-cart-count]',
    accountIcon: 'a[href="/account"], a[href="/account/login"], .header__account',
    mobileMenuToggle: '.header__menu-toggle, [data-mobile-nav-toggle], button[aria-label*="Menu"], .hamburger',
  },

  // ──────────────────────────────────────────────
  // Mobile Navigation
  // ──────────────────────────────────────────────
  mobileNav: {
    drawer: '.mobile-nav, .menu-drawer, [data-mobile-nav], .drawer--left',
    links: '.mobile-nav a, .menu-drawer a, .mobile-nav__link',
    closeButton: '.mobile-nav__close, .menu-drawer__close, [data-mobile-nav-close]',
  },

  // ──────────────────────────────────────────────
  // Homepage
  // ──────────────────────────────────────────────
  homepage: {
    heroBanner: '.hero, .banner, [data-section-type="slideshow"], [data-section-type="hero"], .hero-banner, section:first-of-type',
    featuredProducts: '.featured-collection, [data-section-type="featured-collection"]',
    contentSections: 'main section, .shopify-section',
  },

  // ──────────────────────────────────────────────
  // Product Listing / Collection Page
  // ──────────────────────────────────────────────
  collection: {
    productGrid: '.collection-products, .product-grid, [data-collection-products], .grid--products',
    productCard: '.product-card, .grid__item, .product-item, [data-product-card]',
    productTitle: '.product-card__title, .product-item__title, .card__heading, .product-card a',
    productPrice: '.product-card__price, .price, .product-item__price, .money',
    productImage: '.product-card img, .product-item img, .card__media img',
    sortDropdown: '.collection-sort, [data-sort-by], select[name="sort_by"], .facets__sort',
    filterSection: '.collection-filters, .facets, [data-filter], .filter-group',
    pagination: '.pagination, [data-pagination], .collection-pagination, nav[aria-label="Pagination"]',
    noResults: '.collection-empty, .no-results',
  },

  // ──────────────────────────────────────────────
  // Product Detail Page (PDP)
  // ──────────────────────────────────────────────
  pdp: {
    title: 'h1, .product__title, [data-product-title]',
    price: '.product__price, .price, [data-product-price], .money',
    description: '.product__description, [data-product-description], .product-description',
    mainImage: '.product__media img, .product-image img, [data-product-image], .product__media-item img',
    imageGallery: '.product__media, .product-gallery, .product__media-list',
    thumbnails: '.product__media-toggle, .thumbnail-list button, .product__media-item',
    variantSelector: '.product-form__input, [data-variant-selector], .variant-selector, fieldset .product-form__input',
    variantOptions: '.product-form__input input, .variant-selector input, .product-form__input select',
    quantityInput: 'input[name="quantity"], .quantity-input input, [data-quantity-input]',
    quantityIncrease: '.quantity-input__button--plus, button[name="plus"], [data-quantity-plus]',
    quantityDecrease: '.quantity-input__button--minus, button[name="minus"], [data-quantity-minus]',
    addToCartButton: 'button[type="submit"][name="add"], .product-form__submit, [data-add-to-cart], button:has-text("Add to")',
    addToCartDisabled: '.product-form__submit[disabled], [data-add-to-cart][disabled]',
    breadcrumbs: '.breadcrumbs, nav[aria-label="Breadcrumb"], .breadcrumb',
    yotpoReviews: '.yotpo, .yotpo-widget-instance, [data-yotpo], .yotpo-main-widget',
    rechargeSubscription: '.rc-widget, [data-recharge], .subscription-widget',
  },

  // ──────────────────────────────────────────────
  // Shopping Cart
  // ──────────────────────────────────────────────
  cart: {
    container: '.cart, [data-cart], .cart-page, main',
    lineItem: '.cart-item, .cart__item, [data-cart-item], tr.cart-item',
    lineItemTitle: '.cart-item__title, .cart-item__name, .cart-item a',
    lineItemPrice: '.cart-item__price, .cart-item .money, .cart-item .price',
    lineItemImage: '.cart-item img, .cart-item__image img',
    quantityInput: '.cart-item input[type="number"], .cart-item .quantity-input input',
    quantityIncrease: '.cart-item .quantity-input__button--plus, .cart-item button[name="plus"]',
    quantityDecrease: '.cart-item .quantity-input__button--minus, .cart-item button[name="minus"]',
    removeButton: '.cart-item__remove, .cart-remove, [data-cart-remove], a[href*="/cart/change"]',
    subtotal: '.cart__subtotal, .cart-subtotal, [data-cart-subtotal], .totals__subtotal-value',
    checkoutButton: 'button[name="checkout"], a[href*="checkout"], .cart__checkout-button, [data-checkout-button]',
    emptyMessage: '.cart--empty, .cart-empty, [data-cart-empty], .empty-cart',
    cartDrawer: '.cart-drawer, .drawer--right, [data-cart-drawer], .mini-cart',
  },

  // ──────────────────────────────────────────────
  // Checkout (Shopify Checkout)
  // ──────────────────────────────────────────────
  checkout: {
    emailInput: '#email, input[name="email"], [data-email-input]',
    firstNameInput: '#first_name, input[name="firstName"], input[name="shipping_address[first_name]"]',
    lastNameInput: '#last_name, input[name="lastName"], input[name="shipping_address[last_name]"]',
    addressInput: '#address1, input[name="address1"], input[name="shipping_address[address1]"]',
    cityInput: '#city, input[name="city"], input[name="shipping_address[city]"]',
    stateSelect: '#province, select[name="province"], select[name="shipping_address[province]"]',
    zipInput: '#zip, input[name="zip"], input[name="shipping_address[zip]"]',
    continueButton: '#continue_button, button[type="submit"]:has-text("Continue"), .step__footer button',
    shippingMethods: '.shipping-method, [data-shipping-method], .radio-wrapper',
    orderSummary: '.order-summary, [data-order-summary], .sidebar',
  },

  // ──────────────────────────────────────────────
  // Search (Searchanise)
  // ──────────────────────────────────────────────
  search: {
    input: 'input[type="search"], input[name="q"], .search__input, #search-input, [data-search-input]',
    submitButton: 'button[type="submit"][aria-label*="Search"], .search__button',
    results: '.search-results, .predictive-search__results, [data-search-results], .snize-search-results',
    resultItem: '.search-results a, .predictive-search__item, .snize-product',
    noResults: '.search-no-results, .predictive-search__no-results, .snize-no-results',
    suggestions: '.search-suggestions, .predictive-search, .snize-suggestions',
  },

  // ──────────────────────────────────────────────
  // Account Pages
  // ──────────────────────────────────────────────
  account: {
    loginForm: '#customer_login, form[action*="/account/login"], .login-form',
    emailInput: '#customer_login input[type="email"], input[name="customer[email]"]',
    passwordInput: '#customer_login input[type="password"], input[name="customer[password]"]',
    loginButton: '#customer_login button[type="submit"], .login-form button[type="submit"]',
    registerForm: '#create_customer, form[action*="/account"], .register-form',
    passwordResetLink: 'a[href="#recover"], .login__forgot, a:has-text("Forgot")',
    passwordResetForm: '#recover, form[action*="/account/recover"], .recover-form',
    errorMessage: '.form__message--error, .errors, .alert--error',
  },

  // ──────────────────────────────────────────────
  // Footer
  // ──────────────────────────────────────────────
  footer: {
    container: 'footer, [data-section-type="footer"], .footer',
    links: 'footer a, .footer a, .footer__links a',
    newsletter: '.footer__newsletter, .newsletter-form, form[action*="subscribe"]',
    newsletterInput: '.footer__newsletter input[type="email"], .newsletter-form input',
    socialLinks: '.footer__social, .social-links, footer a[href*="facebook"], footer a[href*="instagram"]',
  },

  // ──────────────────────────────────────────────
  // Third-Party Widgets & Apps
  // ──────────────────────────────────────────────
  thirdParty: {
    zendeskIcon: 'iframe#launcher, #webWidget, [data-testid="launcher"], #ze-snippet',
    currentOfferPopup: '.current-offer-popup, [data-popup-type="offer"], .offer-banner',
  },

  // ──────────────────────────────────────────────
  // Common UI Elements
  // ──────────────────────────────────────────────
  common: {
    cookieBanner: '.cookie-banner, [data-cookie-banner], .cc-banner, #cookie-consent',
    cookieAccept: '.cookie-banner button, [data-cookie-accept], .cc-accept, #cookie-consent button',
    promoPopup: '.popup, .modal, [data-popup], .newsletter-popup, .klaviyo-form',
    promoPopupClose: '.popup__close, .modal__close, [data-popup-close], .klaviyo-close-form, button[aria-label="Close"]',
    loadingSpinner: '.loading, .spinner, [data-loading]',
    skipToContent: 'a[href="#MainContent"], .skip-to-content, a.skip-link',
  },

  // ──────────────────────────────────────────────
  // SEO / Meta
  // ──────────────────────────────────────────────
  seo: {
    title: 'title',
    metaDescription: 'meta[name="description"]',
    canonical: 'link[rel="canonical"]',
    ogTitle: 'meta[property="og:title"]',
    ogDescription: 'meta[property="og:description"]',
    ogImage: 'meta[property="og:image"]',
    ogUrl: 'meta[property="og:url"]',
    jsonLd: 'script[type="application/ld+json"]',
    robotsMeta: 'meta[name="robots"]',
  },

  // ──────────────────────────────────────────────
  // Captcha
  // ──────────────────────────────────────────────
  captcha: {
    hCaptcha: '.h-captcha, iframe[src*="hcaptcha"], [data-hcaptcha]',
    recaptcha: '.g-recaptcha, iframe[src*="recaptcha"]',
  },
} as const;
