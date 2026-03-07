/**
 * Lightweight i18n for GuardScope extension.
 * Supports 'en' (English) and 'fr' (French — West Africa).
 * Uses navigator.language to auto-detect locale.
 */

const EN = {
  // App states
  analyzing: 'Analyzing...',
  analyzeBtn: 'Analyze This Email',
  analyzeAgainBtn: 'Analyze Again',
  scanning: 'SCANNING',
  noEmailTitle: 'No email open',
  noEmailBody: 'Open an email in Gmail, then click "Analyze This Email" to scan it for phishing.',
  idleTitle: 'Ready to analyze',
  idleBody: 'Click "Analyze This Email" below to run a full security scan.',
  from: 'From',
  // Error states
  errorTitle: 'Analysis failed',
  noEmailSelected: 'No email selected',
  pageReloadNeeded: 'Page reload needed',
  connectionError: 'Connection error',
  // Limit reached
  limitTitle: 'Monthly limit reached',
  limitBody: "You've used all 5 free analyses this month.\nUpgrade to Pro for unlimited scans, priority AI, and team features.",
  upgradeBtn: 'Upgrade to Pro — $4.99/mo',
  maybeLater: 'Maybe later',
  // Result
  copyReport: 'Copy report to clipboard',
  copied: '✓ Copied to clipboard',
  historyBtn: 'History',
  recentScans: 'Recent Scans',
  closeHistory: '✕ Close',
  mercuryDeep: 'Mercury-2 AI deep scan',
  ruleBased: 'Rule-based fallback',
  // Footer
  poweredBy: 'Powered by Mercury-2 AI',
  // Progress steps
  progressSteps: [
    'Connecting to GuardScope...',
    'Checking email authentication...',
    'Scanning links for malware...',
    'Looking up domain registration...',
    'Running AI deep analysis...',
    'Scoring threat signals...',
    'Generating report...',
  ],
} as const

const FR = {
  // App states
  analyzing: 'Analyse en cours...',
  analyzeBtn: 'Analyser cet email',
  analyzeAgainBtn: 'Analyser à nouveau',
  scanning: 'ANALYSE',
  noEmailTitle: 'Aucun email ouvert',
  noEmailBody: 'Ouvrez un email dans Gmail, puis cliquez sur "Analyser cet email" pour le scanner.',
  idleTitle: 'Prêt à analyser',
  idleBody: 'Cliquez sur "Analyser cet email" ci-dessous pour lancer une analyse complète.',
  from: 'De',
  // Error states
  errorTitle: "Échec de l'analyse",
  noEmailSelected: 'Aucun email sélectionné',
  pageReloadNeeded: 'Rechargement nécessaire',
  connectionError: 'Erreur de connexion',
  // Limit reached
  limitTitle: 'Limite mensuelle atteinte',
  limitBody: "Vous avez utilisé les 5 analyses gratuites ce mois-ci.\nPassez à Pro pour des analyses illimitées.",
  upgradeBtn: 'Passer à Pro — $4.99/mois',
  maybeLater: 'Plus tard',
  // Result
  copyReport: 'Copier le rapport',
  copied: '✓ Copié dans le presse-papier',
  historyBtn: 'Historique',
  recentScans: 'Analyses récentes',
  closeHistory: '✕ Fermer',
  mercuryDeep: 'Analyse approfondie Mercury-2 AI',
  ruleBased: 'Rapport basé sur les règles',
  // Footer
  poweredBy: 'Propulsé par Mercury-2 AI',
  // Progress steps
  progressSteps: [
    'Connexion à GuardScope...',
    "Vérification de l'authentification...",
    'Scan des liens pour les logiciels malveillants...',
    "Vérification de l'enregistrement du domaine...",
    "Analyse approfondie par IA en cours...",
    'Évaluation des signaux de menace...',
    'Génération du rapport...',
  ],
} as const

type Translations = typeof EN

function detectLocale(): 'en' | 'fr' {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  if (lang.startsWith('fr')) return 'fr'
  return 'en'
}

const TRANSLATIONS: Record<string, Translations> = { en: EN, fr: FR }

let _locale: 'en' | 'fr' | null = null

export function t(key: keyof Translations): string {
  if (!_locale) _locale = detectLocale()
  const translations = TRANSLATIONS[_locale] ?? EN
  const value = translations[key]
  if (Array.isArray(value)) return value.join('|') // shouldn't be called for arrays
  return value as string
}

export function tArray(key: 'progressSteps'): readonly string[] {
  if (!_locale) _locale = detectLocale()
  const translations = TRANSLATIONS[_locale] ?? EN
  return translations[key]
}

export function getLocale(): 'en' | 'fr' {
  if (!_locale) _locale = detectLocale()
  return _locale
}
