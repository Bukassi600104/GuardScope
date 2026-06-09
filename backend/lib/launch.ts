export const PUBLISHED_CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/guardscope-email-security/fbjajjiepjmcmkcidfbmjbjmmegokhif'

export const CHROME_WEB_STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL?.trim() || PUBLISHED_CHROME_WEB_STORE_URL

export const EXTENSION_STATUS =
  process.env.NEXT_PUBLIC_EXTENSION_STATUS === 'early_access' ? 'early_access' : 'listed'

export const CTA_HREF = EXTENSION_STATUS === 'listed' ? CHROME_WEB_STORE_URL : '/#early-access'
export const CTA_LABEL = EXTENSION_STATUS === 'listed' ? 'Add to Chrome' : 'Get early access'

export const QUOTAS = {
  anonymousDaily: 5,
  signedInFreeMonthly: 5,
  promoProDays: 30,
}

export const SUPPORT_EMAIL = 'support@guardscope.app'
export const PRIVACY_EMAIL = 'privacy@guardscope.app'
