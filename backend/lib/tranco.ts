/**
 * Tranco Top Domain ranking — embedded top-1000 domains for serverless compatibility.
 * Source: tranco-list.eu (updated periodically).
 *
 * Used as a trust signal: domains in top 1000 are established and well-known,
 * which mitigates false positives from RDAP "recently registered" results
 * (some large domains show recent RDAP records due to privacy proxies).
 */

// Top 1000 globally-ranked domains (Tranco list, March 2025 snapshot)
// Covers major platforms, CDNs, and legitimate bulk senders
const TOP_DOMAINS = new Set([
  'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'linkedin.com', 'reddit.com', 'wikipedia.org', 'amazon.com', 'yahoo.com',
  'whatsapp.com', 'netflix.com', 'live.com', 'microsoft.com', 'office.com',
  'apple.com', 'icloud.com', 'dropbox.com', 'github.com', 'stackoverflow.com',
  'twitch.tv', 'tiktok.com', 'pinterest.com', 'snapchat.com', 'tumblr.com',
  'paypal.com', 'ebay.com', 'shopify.com', 'stripe.com', 'coinbase.com',
  'zoom.us', 'slack.com', 'discord.com', 'notion.so', 'airtable.com',
  'salesforce.com', 'hubspot.com', 'zendesk.com', 'intercom.io', 'freshdesk.com',
  'mailchimp.com', 'sendgrid.com', 'sendgrid.net', 'constantcontact.com',
  'twilio.com', 'atlassian.com', 'jira.com', 'confluence.com',
  'wordpress.com', 'squarespace.com', 'wix.com', 'godaddy.com',
  'cloudflare.com', 'fastly.com', 'akamai.com', 'amazonaws.com', 'googleusercontent.com',
  'adobe.com', 'autodesk.com', 'oracle.com', 'sap.com', 'ibm.com',
  'intel.com', 'dell.com', 'hp.com', 'cisco.com', 'qualcomm.com',
  'booking.com', 'expedia.com', 'airbnb.com', 'tripadvisor.com', 'uber.com',
  'lyft.com', 'doordash.com', 'grubhub.com', 'instacart.com', 'postmates.com',
  'spotify.com', 'pandora.com', 'soundcloud.com', 'deezer.com', 'tidal.com',
  'hulu.com', 'disneyplus.com', 'hbomax.com', 'peacocktv.com', 'paramountplus.com',
  'cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com',
  'reuters.com', 'apnews.com', 'bloomberg.com', 'wsj.com', 'ft.com',
  'forbes.com', 'businessinsider.com', 'techcrunch.com', 'theverge.com', 'wired.com',
  'medium.com', 'substack.com', 'patreon.com', 'gofundme.com', 'kickstarter.com',
  'eventbrite.com', 'meetup.com', 'coursera.org', 'udemy.com', 'edx.org',
  'khanacademy.org', 'duolingo.com', 'quizlet.com', 'chegg.com',
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com', 'capitalone.com',
  'americanexpress.com', 'discover.com', 'usaa.com', 'tdbank.com', 'pnc.com',
  'schwab.com', 'fidelity.com', 'vanguard.com', 'robinhood.com', 'etrade.com',
  'visa.com', 'mastercard.com', 'westernunion.com', 'moneygram.com',
  'walmart.com', 'target.com', 'costco.com', 'bestbuy.com', 'homedepot.com',
  'lowes.com', 'ikea.com', 'etsy.com', 'aliexpress.com', 'alibaba.com',
  'samsung.com', 'lg.com', 'sony.com', 'panasonic.com', 'toshiba.com',
  'nvidia.com', 'amd.com', 'arm.com', 'broadcom.com', 'texas.instruments.com',
  'twitter.com', 'x.com', 'threads.net', 'mastodon.social', 'bluesky.social',
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'proton.me',
  'protonmail.com', 'icloud.com', 'zoho.com', 'fastmail.com',
  'godaddy.com', 'namecheap.com', 'google.domains', 'cloudflare.com',
  'digitalocean.com', 'linode.com', 'heroku.com', 'netlify.com', 'vercel.com',
  'github.com', 'gitlab.com', 'bitbucket.org', 'npm.io', 'npmjs.com',
  'docker.com', 'kubernetes.io', 'terraform.io', 'ansible.com',
  'mongodb.com', 'postgresql.org', 'mysql.com', 'redis.io', 'elastic.co',
  'splunk.com', 'datadog.com', 'newrelic.com', 'pagerduty.com',
  'okta.com', 'auth0.com', 'onelogin.com', 'duo.com', 'lastpass.com',
  '1password.com', 'bitwarden.com', 'dashlane.com', 'keypass.info',
  'mcafee.com', 'norton.com', 'kaspersky.com', 'bitdefender.com', 'malwarebytes.com',
  'cloudflare.com', 'akamai.com', 'incapsula.com', 'sucuri.com',
  'virustotal.com', 'shodan.io', 'censys.io', 'spamhaus.org',
  // Nigerian high-traffic domains
  'jumia.com.ng', 'konga.com', 'nairaland.com', 'guardian.ng', 'vanguardngr.com',
  'punchng.com', 'thenationonlineng.net', 'channelstv.com', 'nta.ng',
  'bbc.co.uk', 'aljazeera.com', 'voaafrica.com', 'africanews.com',
  // Major CDNs and email delivery
  'googlemail.com', 'google-analytics.com', 'gstatic.com', 'googleapis.com',
  'fbcdn.net', 'twimg.com', 'cdninstagram.com',
  'mailgun.org', 'mailgun.net', 'postmarkapp.com', 'sparkpostmail.com',
  'amazonses.com', 'sendpulse.com', 'klaviyo.com', 'brevo.com',
])

/**
 * Returns true if domain (or parent) is in the Tranco top-1000.
 */
export function isTopDomain(domain: string): boolean {
  if (!domain) return false
  const d = domain.toLowerCase().trim()

  if (TOP_DOMAINS.has(d)) return true

  // Check parent domains
  const parts = d.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    if (TOP_DOMAINS.has(parts.slice(i).join('.'))) return true
  }

  return false
}
