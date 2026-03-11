import { GuardScopeLogo } from './components/GuardScopeLogo'
import type { CSSProperties } from 'react'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://backend-gules-sigma-37.vercel.app'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    type: 'website',
  },
}

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const C = {
  navy:    '#071C2C',
  navy2:   '#0a2338',
  navy3:   '#0d2d47',
  cyan:    '#39B6FF',
  cyan2:   '#1F8DFF',
  cyan3:   '#6DD5FA',
  white:   '#E7EEF4',
  muted:   '#8ba3b8',
  muted2:  '#4a6478',
  border:  'rgba(57,182,255,0.15)',
  border2: 'rgba(57,182,255,0.08)',
  success: '#1ED760',
  warning: '#FFB020',
  danger:  '#FF4D4F',
} as const

const s = {
  section: { padding: '96px 24px', maxWidth: 1160, margin: '0 auto' } as CSSProperties,
  sectionSm: { padding: '72px 24px', maxWidth: 1160, margin: '0 auto' } as CSSProperties,
  wrap: { maxWidth: 1160, margin: '0 auto', padding: '0 24px' } as CSSProperties,

  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.cyan, marginBottom: 14, display: 'block' },
  h1: { fontSize: 'clamp(38px,6vw,72px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.white, marginBottom: 24 },
  h2: { fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: C.white, marginBottom: 16 },
  h3: { fontSize: 17, fontWeight: 600, color: C.white, marginBottom: 8 },
  lead: { fontSize: 18, color: C.muted, lineHeight: 1.75, maxWidth: 560 },
  body: { fontSize: 15, color: C.muted, lineHeight: 1.75 },

  card: {
    background: 'rgba(10,35,56,0.55)',
    border: '1px solid rgba(57,182,255,0.12)',
    borderRadius: 20,
    padding: 28,
    backdropFilter: 'blur(12px)',
  } as CSSProperties,

  cardGlow: {
    background: 'rgba(10,35,56,0.7)',
    border: '1px solid rgba(57,182,255,0.25)',
    borderRadius: 20,
    padding: 32,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 0 40px rgba(57,182,255,0.06)',
  } as CSSProperties,

  divider: { height: 1, background: 'rgba(57,182,255,0.08)', margin: '0' } as CSSProperties,

  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 28px', fontSize: 15, fontWeight: 700,
    background: 'linear-gradient(135deg, #39B6FF 0%, #1F8DFF 100%)',
    color: '#fff', borderRadius: 12,
    boxShadow: '0 4px 24px rgba(57,182,255,0.3)',
    transition: 'all .2s',
  } as CSSProperties,

  btnOutline: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 28px', fontSize: 15, fontWeight: 600,
    background: 'transparent', color: C.white, borderRadius: 12,
    border: '1px solid rgba(57,182,255,0.25)',
    transition: 'all .2s',
  } as CSSProperties,
} as const

// ─────────────────────────────────────────────────────────────
// Background bug animation — cyber threats crawling & getting scanned
// ─────────────────────────────────────────────────────────────
function BugBackground() {
  const bugs = [
    { top: '8%',  left: '4%',   anim: 'bugCrawl1', dur: '18s', delay: '0s',   size: 18, trapped: false },
    { top: '15%', left: '88%',  anim: 'bugCrawl2', dur: '22s', delay: '-4s',  size: 14, trapped: true  },
    { top: '35%', left: '93%',  anim: 'bugCrawl3', dur: '16s', delay: '-8s',  size: 16, trapped: false },
    { top: '55%', left: '2%',   anim: 'bugCrawl4', dur: '24s', delay: '-3s',  size: 12, trapped: true  },
    { top: '72%', left: '78%',  anim: 'bugCrawl1', dur: '20s', delay: '-11s', size: 15, trapped: false },
    { top: '82%', left: '18%',  anim: 'bugCrawl2', dur: '17s', delay: '-6s',  size: 13, trapped: false },
    { top: '25%', left: '48%',  anim: 'bugCrawl3', dur: '26s', delay: '-14s', size: 10, trapped: true  },
    { top: '65%', left: '55%',  anim: 'bugCrawl4', dur: '19s', delay: '-9s',  size: 17, trapped: false },
    { top: '45%', left: '22%',  anim: 'bugCrawl1', dur: '23s', delay: '-2s',  size: 11, trapped: true  },
    { top: '90%', left: '62%',  anim: 'bugCrawl2', dur: '15s', delay: '-7s',  size: 14, trapped: false },
    { top: '5%',  left: '62%',  anim: 'bugCrawl3', dur: '21s', delay: '-12s', size: 12, trapped: true  },
    { top: '48%', left: '72%',  anim: 'bugCrawl4', dur: '28s', delay: '-5s',  size: 16, trapped: false },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes bugCrawl1 {
          0%   { transform: translate(0px,0px) rotate(0deg); }
          20%  { transform: translate(28px,-18px) rotate(40deg); }
          40%  { transform: translate(12px,32px) rotate(-20deg); }
          60%  { transform: translate(-22px,16px) rotate(60deg); }
          80%  { transform: translate(8px,-28px) rotate(-40deg); }
          100% { transform: translate(0px,0px) rotate(0deg); }
        }
        @keyframes bugCrawl2 {
          0%   { transform: translate(0px,0px) rotate(10deg); }
          25%  { transform: translate(-30px,20px) rotate(-30deg); }
          50%  { transform: translate(20px,40px) rotate(50deg); }
          75%  { transform: translate(35px,-15px) rotate(-10deg); }
          100% { transform: translate(0px,0px) rotate(10deg); }
        }
        @keyframes bugCrawl3 {
          0%   { transform: translate(0px,0px) rotate(-15deg); }
          30%  { transform: translate(22px,25px) rotate(35deg); }
          55%  { transform: translate(-18px,38px) rotate(-45deg); }
          80%  { transform: translate(-28px,-12px) rotate(20deg); }
          100% { transform: translate(0px,0px) rotate(-15deg); }
        }
        @keyframes bugCrawl4 {
          0%   { transform: translate(0px,0px) rotate(5deg); }
          33%  { transform: translate(-25px,-22px) rotate(-35deg); }
          66%  { transform: translate(30px,-35px) rotate(55deg); }
          100% { transform: translate(0px,0px) rotate(5deg); }
        }
        @keyframes scanRing {
          0%   { transform: scale(0.4); opacity: 0; }
          15%  { transform: scale(1.1); opacity: 0.8; }
          50%  { transform: scale(1); opacity: 0.6; }
          85%  { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(0.4); opacity: 0; }
        }
        @keyframes trappedPulse {
          0%, 100% { opacity: 0.07; }
          50%       { opacity: 0.03; }
        }
        @keyframes freeBug {
          0%, 100% { opacity: 0.055; }
          50%       { opacity: 0.03; }
        }
      `}</style>

      {bugs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: b.top, left: b.left,
          animation: `${b.anim} ${b.dur} ${b.delay} ease-in-out infinite`,
        }}>
          {/* Bug SVG */}
          <div style={{
            animation: b.trapped ? `trappedPulse 3s ease-in-out infinite` : `freeBug 4s ease-in-out infinite`,
            color: b.trapped ? '#FF4D4F' : '#FFB020',
          }}>
            <svg width={b.size} height={b.size} viewBox="0 0 24 24" fill="currentColor">
              {/* Body */}
              <ellipse cx="12" cy="13" rx="4.5" ry="5.5" />
              {/* Head */}
              <circle cx="12" cy="6.5" r="2.8" />
              {/* Antennae */}
              <line x1="10.5" y1="4.2" x2="8" y2="1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="13.5" y1="4.2" x2="16" y2="1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              {/* Legs */}
              <line x1="7.5" y1="10" x2="3" y2="8.5"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="7.5" y1="13" x2="3" y2="13"   stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="7.5" y1="16" x2="3" y2="17.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="16.5" y1="10" x2="21" y2="8.5"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="16.5" y1="13" x2="21" y2="13"   stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="16.5" y1="16" x2="21" y2="17.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>

          {/* Scan ring for trapped bugs */}
          {b.trapped && (
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: b.size * 2.8, height: b.size * 2.8,
              marginLeft: -(b.size * 2.8) / 2,
              marginTop: -(b.size * 2.8) / 2,
              animation: `scanRing 4s ease-in-out infinite`,
            }}>
              <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="17" stroke="#39B6FF" strokeWidth="1.5" strokeDasharray="4 3" />
                <circle cx="20" cy="20" r="10" stroke="#39B6FF" strokeWidth="0.8" opacity="0.5" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Complete country list
// ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  // Africa first (primary market)
  { code: 'NG', name: '🇳🇬 Nigeria' },
  { code: 'GH', name: '🇬🇭 Ghana' },
  { code: 'KE', name: '🇰🇪 Kenya' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'ET', name: '🇪🇹 Ethiopia' },
  { code: 'TZ', name: '🇹🇿 Tanzania' },
  { code: 'UG', name: '🇺🇬 Uganda' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'MA', name: '🇲🇦 Morocco' },
  { code: 'SN', name: '🇸🇳 Senegal' },
  { code: 'CI', name: "🇨🇮 Côte d'Ivoire" },
  { code: 'CM', name: '🇨🇲 Cameroon' },
  { code: 'AO', name: '🇦🇴 Angola' },
  { code: 'MZ', name: '🇲🇿 Mozambique' },
  { code: 'MG', name: '🇲🇬 Madagascar' },
  { code: 'DZ', name: '🇩🇿 Algeria' },
  { code: 'SD', name: '🇸🇩 Sudan' },
  { code: 'ZM', name: '🇿🇲 Zambia' },
  { code: 'ZW', name: '🇿🇼 Zimbabwe' },
  { code: 'RW', name: '🇷🇼 Rwanda' },
  { code: 'TN', name: '🇹🇳 Tunisia' },
  { code: 'BF', name: '🇧🇫 Burkina Faso' },
  { code: 'ML', name: '🇲🇱 Mali' },
  { code: 'ER', name: '🇪🇷 Eritrea' },
  { code: 'GM', name: '🇬🇲 Gambia' },
  { code: 'GW', name: '🇬🇼 Guinea-Bissau' },
  { code: 'GN', name: '🇬🇳 Guinea' },
  { code: 'LR', name: '🇱🇷 Liberia' },
  { code: 'SL', name: '🇸🇱 Sierra Leone' },
  { code: 'TG', name: '🇹🇬 Togo' },
  { code: 'BJ', name: '🇧🇯 Benin' },
  { code: 'NE', name: '🇳🇪 Niger' },
  { code: 'TD', name: '🇹🇩 Chad' },
  { code: 'SS', name: '🇸🇸 South Sudan' },
  { code: 'SO', name: '🇸🇴 Somalia' },
  { code: 'DJ', name: '🇩🇯 Djibouti' },
  { code: 'BI', name: '🇧🇮 Burundi' },
  { code: 'CF', name: '🇨🇫 Central African Republic' },
  { code: 'CG', name: '🇨🇬 Republic of Congo' },
  { code: 'CD', name: '🇨🇩 DR Congo' },
  { code: 'GA', name: '🇬🇦 Gabon' },
  { code: 'GQ', name: '🇬🇶 Equatorial Guinea' },
  { code: 'ST', name: '🇸🇹 São Tomé and Príncipe' },
  { code: 'CV', name: '🇨🇻 Cape Verde' },
  { code: 'MW', name: '🇲🇼 Malawi' },
  { code: 'LS', name: '🇱🇸 Lesotho' },
  { code: 'SZ', name: '🇸🇿 Eswatini' },
  { code: 'BW', name: '🇧🇼 Botswana' },
  { code: 'NA', name: '🇳🇦 Namibia' },
  { code: 'SC', name: '🇸🇨 Seychelles' },
  { code: 'MU', name: '🇲🇺 Mauritius' },
  { code: 'KM', name: '🇰🇲 Comoros' },
  { code: 'LY', name: '🇱🇾 Libya' },
  { code: 'MR', name: '🇲🇷 Mauritania' },
  { code: 'EH', name: '🇪🇭 Western Sahara' },
  // Rest of world — alphabetical
  { code: 'AF', name: '🇦🇫 Afghanistan' },
  { code: 'AL', name: '🇦🇱 Albania' },
  { code: 'AD', name: '🇦🇩 Andorra' },
  { code: 'AG', name: '🇦🇬 Antigua and Barbuda' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'AM', name: '🇦🇲 Armenia' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'AT', name: '🇦🇹 Austria' },
  { code: 'AZ', name: '🇦🇿 Azerbaijan' },
  { code: 'BS', name: '🇧🇸 Bahamas' },
  { code: 'BH', name: '🇧🇭 Bahrain' },
  { code: 'BD', name: '🇧🇩 Bangladesh' },
  { code: 'BB', name: '🇧🇧 Barbados' },
  { code: 'BY', name: '🇧🇾 Belarus' },
  { code: 'BE', name: '🇧🇪 Belgium' },
  { code: 'BZ', name: '🇧🇿 Belize' },
  { code: 'BT', name: '🇧🇹 Bhutan' },
  { code: 'BO', name: '🇧🇴 Bolivia' },
  { code: 'BA', name: '🇧🇦 Bosnia and Herzegovina' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'BN', name: '🇧🇳 Brunei' },
  { code: 'BG', name: '🇧🇬 Bulgaria' },
  { code: 'KH', name: '🇰🇭 Cambodia' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'CR', name: '🇨🇷 Costa Rica' },
  { code: 'HR', name: '🇭🇷 Croatia' },
  { code: 'CU', name: '🇨🇺 Cuba' },
  { code: 'CY', name: '🇨🇾 Cyprus' },
  { code: 'CZ', name: '🇨🇿 Czech Republic' },
  { code: 'DK', name: '🇩🇰 Denmark' },
  { code: 'DM', name: '🇩🇲 Dominica' },
  { code: 'DO', name: '🇩🇴 Dominican Republic' },
  { code: 'EC', name: '🇪🇨 Ecuador' },
  { code: 'SV', name: '🇸🇻 El Salvador' },
  { code: 'EE', name: '🇪🇪 Estonia' },
  { code: 'FJ', name: '🇫🇯 Fiji' },
  { code: 'FI', name: '🇫🇮 Finland' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'GE', name: '🇬🇪 Georgia' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'GR', name: '🇬🇷 Greece' },
  { code: 'GD', name: '🇬🇩 Grenada' },
  { code: 'GT', name: '🇬🇹 Guatemala' },
  { code: 'GY', name: '🇬🇾 Guyana' },
  { code: 'HT', name: '🇭🇹 Haiti' },
  { code: 'HN', name: '🇭🇳 Honduras' },
  { code: 'HU', name: '🇭🇺 Hungary' },
  { code: 'IS', name: '🇮🇸 Iceland' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'IR', name: '🇮🇷 Iran' },
  { code: 'IQ', name: '🇮🇶 Iraq' },
  { code: 'IE', name: '🇮🇪 Ireland' },
  { code: 'IL', name: '🇮🇱 Israel' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'JM', name: '🇯🇲 Jamaica' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'JO', name: '🇯🇴 Jordan' },
  { code: 'KZ', name: '🇰🇿 Kazakhstan' },
  { code: 'KI', name: '🇰🇮 Kiribati' },
  { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'KG', name: '🇰🇬 Kyrgyzstan' },
  { code: 'LA', name: '🇱🇦 Laos' },
  { code: 'LV', name: '🇱🇻 Latvia' },
  { code: 'LB', name: '🇱🇧 Lebanon' },
  { code: 'LI', name: '🇱🇮 Liechtenstein' },
  { code: 'LT', name: '🇱🇹 Lithuania' },
  { code: 'LU', name: '🇱🇺 Luxembourg' },
  { code: 'MK', name: '🇲🇰 North Macedonia' },
  { code: 'MV', name: '🇲🇻 Maldives' },
  { code: 'MT', name: '🇲🇹 Malta' },
  { code: 'MH', name: '🇲🇭 Marshall Islands' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'FM', name: '🇫🇲 Micronesia' },
  { code: 'MD', name: '🇲🇩 Moldova' },
  { code: 'MC', name: '🇲🇨 Monaco' },
  { code: 'MN', name: '🇲🇳 Mongolia' },
  { code: 'ME', name: '🇲🇪 Montenegro' },
  { code: 'MM', name: '🇲🇲 Myanmar' },
  { code: 'NR', name: '🇳🇷 Nauru' },
  { code: 'NP', name: '🇳🇵 Nepal' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'NZ', name: '🇳🇿 New Zealand' },
  { code: 'NI', name: '🇳🇮 Nicaragua' },
  { code: 'NO', name: '🇳🇴 Norway' },
  { code: 'OM', name: '🇴🇲 Oman' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'PW', name: '🇵🇼 Palau' },
  { code: 'PA', name: '🇵🇦 Panama' },
  { code: 'PG', name: '🇵🇬 Papua New Guinea' },
  { code: 'PY', name: '🇵🇾 Paraguay' },
  { code: 'PE', name: '🇵🇪 Peru' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'QA', name: '🇶🇦 Qatar' },
  { code: 'RO', name: '🇷🇴 Romania' },
  { code: 'RU', name: '🇷🇺 Russia' },
  { code: 'KN', name: '🇰🇳 Saint Kitts and Nevis' },
  { code: 'LC', name: '🇱🇨 Saint Lucia' },
  { code: 'VC', name: '🇻🇨 Saint Vincent and the Grenadines' },
  { code: 'WS', name: '🇼🇸 Samoa' },
  { code: 'SM', name: '🇸🇲 San Marino' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'RS', name: '🇷🇸 Serbia' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'SK', name: '🇸🇰 Slovakia' },
  { code: 'SI', name: '🇸🇮 Slovenia' },
  { code: 'SB', name: '🇸🇧 Solomon Islands' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'SR', name: '🇸🇷 Suriname' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'CH', name: '🇨🇭 Switzerland' },
  { code: 'SY', name: '🇸🇾 Syria' },
  { code: 'TW', name: '🇹🇼 Taiwan' },
  { code: 'TJ', name: '🇹🇯 Tajikistan' },
  { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'TL', name: '🇹🇱 Timor-Leste' },
  { code: 'TO', name: '🇹🇴 Tonga' },
  { code: 'TT', name: '🇹🇹 Trinidad and Tobago' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'TM', name: '🇹🇲 Turkmenistan' },
  { code: 'TV', name: '🇹🇻 Tuvalu' },
  { code: 'UA', name: '🇺🇦 Ukraine' },
  { code: 'AE', name: '🇦🇪 United Arab Emirates' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'UY', name: '🇺🇾 Uruguay' },
  { code: 'UZ', name: '🇺🇿 Uzbekistan' },
  { code: 'VU', name: '🇻🇺 Vanuatu' },
  { code: 'VE', name: '🇻🇪 Venezuela' },
  { code: 'VN', name: '🇻🇳 Vietnam' },
  { code: 'YE', name: '🇾🇪 Yemen' },
]

// ─────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────
function CheckIcon({ color = C.success }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12" />
      <path d="M7 12.5L10.5 16L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon({ color = C.danger }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12" />
      <path d="M15 9L9 15M9 9L15 15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ScanLine() {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, height: 1,
      background: 'linear-gradient(90deg, transparent 0%, #39B6FF 50%, transparent 100%)',
      opacity: 0.6, top: '30%',
    }} />
  )
}

function GridBg() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(57,182,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(57,182,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
    }} />
  )
}

// ─────────────────────────────────────────────────────────────
// Content data
// ─────────────────────────────────────────────────────────────
const STATS = [
  { stat: '91%', desc: 'of cyberattacks begin with a phishing email' },
  { stat: '$17,700', desc: 'lost every minute to phishing globally' },
  { stat: '3.4B', desc: 'phishing emails sent every single day' },
  { stat: '97%', desc: 'of people can\'t spot a sophisticated phish' },
]

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#39B6FF" strokeWidth="1.5"/>
        <path d="M7 11V7a5 5 0 0110 0v4" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Email Authentication',
    desc: 'SPF, DKIM, and DMARC records verified against Cloudflare DNS — confirms the sender is who they claim.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="#39B6FF" strokeWidth="1.5"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Mercury-2 AI Deep Scan',
    desc: 'Reasoning AI reads the email, writes a chain-of-thought, then judges: urgency manipulation, domain deception, impersonation.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Link Safety Scan',
    desc: 'Every URL checked against VirusTotal (90+ engines), Google Safe Browsing, PhishTank, and URLhaus — in parallel.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#39B6FF" strokeWidth="1.5"/>
        <path d="M3 9h18M8 2v4M16 2v4" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="15" r="2" fill="#39B6FF" fillOpacity="0.5"/>
      </svg>
    ),
    title: 'Domain Age Intel',
    desc: 'Domains registered days before an attack are a classic red flag. RDAP lookup catches them instantly.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#39B6FF" strokeWidth="1.5"/>
        <path d="M12 8v4l3 3" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 3.5C8.5 2.5 10 2 12 2" stroke="#39B6FF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Nigeria-Aware Engine',
    desc: 'Trained on EFCC/CBN fraud patterns, BVN phishing, advance-fee scams, and fintech impersonation attacks.',
  },
]

const STEPS = [
  { n: '01', title: 'Open any email in Gmail', desc: 'GuardScope detects the open email and a security panel slides in from the right side of your inbox.' },
  { n: '02', title: 'Click "Analyze This Email"', desc: 'Six parallel scans run simultaneously — DNS auth, domain age, all links, PhishTank, and Mercury-2 AI — completing in 5–8 seconds.' },
  { n: '03', title: 'Read your verdict', desc: 'A clear risk score (0–100), plain-English verdict, and specific flags explaining exactly what looks suspicious.' },
]

const PRIVACY_YES = [
  'Email body discarded immediately after analysis',
  'Zero email content stored — ever',
  'NDPR 2023 & GDPR compliant',
  'Supabase EU infrastructure',
]
const PRIVACY_NO = [
  'Your contacts or address book',
  'Your Gmail password or OAuth token',
  'Browsing history outside Gmail',
  'Email content in any database',
]

const FAQS = [
  { q: 'Does GuardScope read or store my emails?', a: 'Never. Email content is sent to our backend for analysis and discarded immediately after. We never log or store your email body, subject, or sender details.' },
  { q: 'Does it work with all Gmail accounts?', a: 'Yes — personal Gmail and Google Workspace accounts. It works anywhere you access Gmail in Chrome.' },
  { q: 'What if I\'m not a technical person?', a: 'That\'s exactly who we designed it for. Everything is explained in plain English — no cybersecurity knowledge required.' },
  { q: 'Is there a free tier?', a: 'Yes — 5 free email analyses per day, forever. No credit card required to get started.' },
  { q: 'Which AI model powers the analysis?', a: 'Mercury-2 by InceptionLabs — a reasoning model that writes a chain-of-thought before reaching its verdict.' },
  { q: 'Is my data private?', a: 'Completely. We comply with NDPR 2023 (Nigeria) and GDPR, using Supabase EU-hosted infrastructure. Read our Privacy Policy for full details.' },
]

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GuardScope',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <BugBackground />
      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(7,28,44,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(57,182,255,0.1)',
      }}>
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', height: 68 }}>
          <GuardScopeLogo size={34} textSize={18} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ fontSize: 14, color: C.muted, fontWeight: 500, letterSpacing: '0.01em' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 14, color: C.muted, fontWeight: 500, letterSpacing: '0.01em' }}>How it works</a>
            <a href="#early-access" style={{ fontSize: 14, color: C.cyan, fontWeight: 600, letterSpacing: '0.01em' }}>Early Access</a>
            <a href="#faq" style={{ fontSize: 14, color: C.muted, fontWeight: 500, letterSpacing: '0.01em' }}>FAQ</a>
            <a
              href="https://chromewebstore.google.com"
              target="_blank" rel="noopener noreferrer"
              style={{ ...s.btnPrimary, padding: '9px 20px', fontSize: 13 }}
            >
              Install Free
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: '130px 24px 110px', textAlign: 'center',
      }}>
        <GridBg />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse at center, rgba(57,182,255,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <ScanLine />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(57,182,255,0.08)',
            border: '1px solid rgba(57,182,255,0.2)',
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.cyan, display: 'inline-block', boxShadow: '0 0 8px #39B6FF' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.cyan, letterSpacing: '0.02em' }}>
              Early Access — 100 Pro spots, 30 days free
            </span>
          </div>

          <h1 style={s.h1}>
            Inspect Every Email.<br />
            <span style={{
              background: 'linear-gradient(135deg, #6DD5FA 0%, #39B6FF 50%, #1F8DFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Trust Nothing Blindly.
            </span>
          </h1>

          <p style={{ ...s.lead, margin: '0 auto 44px', fontSize: 19 }}>
            GuardScope sits inside Gmail and scans every email with AI, DNS authentication,
            and six real-time threat intelligence sources — in under 8 seconds.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <a href="#early-access" style={{ ...s.btnPrimary, fontSize: 16, padding: '15px 32px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="white"/></svg>
              Get Early Access — Free
            </a>
            <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={{ ...s.btnOutline }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#39B6FF" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="#39B6FF"/></svg>
              Add to Chrome
            </a>
          </div>

          <p style={{ fontSize: 13, color: C.muted2, letterSpacing: '0.01em' }}>
            Works with Gmail personal & Google Workspace · Chrome browser only
          </p>
        </div>

        {/* Mock scan card */}
        <div style={{
          marginTop: 72, maxWidth: 520, margin: '72px auto 0',
          ...s.cardGlow,
          textAlign: 'left',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #FF4D4F, transparent)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, display: 'inline-block', boxShadow: `0 0 8px ${C.danger}` }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.danger, letterSpacing: '0.08em' }}>CRITICAL THREAT DETECTED</span>
            </div>
            <span style={{
              fontSize: 22, fontWeight: 800, color: C.danger,
              background: 'rgba(255,77,79,0.1)', padding: '2px 10px', borderRadius: 8,
            }}>88</span>
          </div>
          <p style={{ fontSize: 14, color: '#a8bfcf', lineHeight: 1.7, marginBottom: 18 }}>
            This email impersonates GTBank using a lookalike domain registered <strong style={{ color: C.white }}>3 days ago</strong>. Links lead to a credential-harvesting page flagged by VirusTotal and PhishTank.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'SPF: Failed — sender not authorized',
              'Domain registered 3 days ago',
              'VirusTotal: 7/90 engines flagged',
              'PhishTank: confirmed phishing URL',
            ].map((flag) => (
              <div key={flag} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <XIcon />
                <span style={{ fontSize: 13, color: '#ffaaaa' }}>{flag}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(57,182,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.muted2 }}>Mercury-2 AI deep scan</span>
            <span style={{ fontSize: 11, color: C.muted2 }}>5.8s</span>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── STATS ── */}
      <section style={{ ...s.sectionSm, paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={s.label}>The Threat</span>
          <h2 style={s.h2}>
            Email phishing costs Africa{' '}
            <span style={{ color: C.danger }}>billions</span> every year
          </h2>
          <p style={{ ...s.lead, margin: '0 auto' }}>
            Attacks are sophisticated, fast-moving, and specifically designed to fool people without security training. Your inbox is the front door — GuardScope guards it.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {STATS.map((item) => (
            <div key={item.stat} style={{ ...s.card, textAlign: 'center' }}>
              <div style={{
                fontSize: 38, fontWeight: 800, marginBottom: 10,
                background: 'linear-gradient(135deg, #6DD5FA 0%, #39B6FF 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{item.stat}</div>
              <p style={{ fontSize: 14, color: C.muted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── FEATURES ── */}
      <section id="features" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={s.label}>Protection layers</span>
          <h2 style={s.h2}>5 layers of analysis<br />on every email</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1px 1fr',
              alignItems: 'center',
              gap: 0,
              padding: '32px 0',
              borderTop: i === 0 ? '1px solid rgba(57,182,255,0.1)' : undefined,
              borderBottom: '1px solid rgba(57,182,255,0.1)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(57,182,255,0.02)',
            }}>
              {/* Left — icon + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingRight: 48 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(57,182,255,0.08)',
                  border: '1px solid rgba(57,182,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.cyan, marginBottom: 4, textTransform: 'uppercase' }}>
                    Layer {i + 1}
                  </div>
                  <h3 style={{ ...s.h3, marginBottom: 0, fontSize: 17 }}>{f.title}</h3>
                </div>
              </div>

              {/* Divider line */}
              <div style={{ width: 1, height: 48, background: 'rgba(57,182,255,0.12)', margin: '0 auto' }} />

              {/* Right — description */}
              <div style={{ paddingLeft: 48 }}>
                <p style={{ ...s.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={s.label}>How it works</span>
          <h2 style={s.h2}>3 steps. 8 seconds.<br />Full verdict.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(57,182,255,0.08)',
                  border: '1px solid rgba(57,182,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: C.cyan,
                  flexShrink: 0,
                }}>
                  {step.n}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: 'rgba(57,182,255,0.15)' }} />
                )}
              </div>
              <div>
                <h3 style={{ ...s.h3, fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                <p style={s.body}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── EARLY ACCESS ── */}
      <section id="early-access" style={{ padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(57,182,255,0.07) 0%, transparent 60%)',
        }} />
        <GridBg />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <span style={s.label}>Limited Beta — 100 Spots</span>
          <h2 style={{ ...s.h2, marginBottom: 16 }}>
            Get 30 Days of Pro Access,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6DD5FA 0%, #39B6FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Free</span>
          </h2>
          <p style={{ ...s.lead, margin: '0 auto 48px', fontSize: 16 }}>
            We&apos;re giving 100 users full Pro access for 30 days — no credit card, no commitment.
            Fill out the form below and we&apos;ll email your personal promo code within minutes.
          </p>

          {/* Early access form */}
          <div style={{ ...s.cardGlow, textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #39B6FF, transparent)', borderRadius: '20px 20px 0 0' }} />

            <h3 style={{ ...s.h3, fontSize: 16, marginBottom: 4 }}>Request your promo code</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>We&apos;ll email your code. It&apos;s valid for 30 days.</p>

            <form action="/api/promo/request" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                  FULL NAME
                </label>
                <input
                  type="text" name="name" required
                  placeholder="Tony Adebayo"
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(57,182,255,0.05)',
                    border: '1px solid rgba(57,182,255,0.2)',
                    borderRadius: 10, color: C.white,
                    fontSize: 14, fontFamily: 'Sora, Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email" name="email" required
                  placeholder="tony@example.com"
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(57,182,255,0.05)',
                    border: '1px solid rgba(57,182,255,0.2)',
                    borderRadius: 10, color: C.white,
                    fontSize: 14, fontFamily: 'Sora, Inter, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                  COUNTRY
                </label>
                <select
                  name="country" required
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(7,28,44,0.9)',
                    border: '1px solid rgba(57,182,255,0.2)',
                    borderRadius: 10, color: C.white,
                    fontSize: 14, fontFamily: 'Sora, Inter, sans-serif',
                    outline: 'none',
                  }}
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                style={{ ...s.btnPrimary, justifyContent: 'center', width: '100%', marginTop: 4 }}
              >
                Send My Promo Code
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </form>

            <p style={{ fontSize: 12, color: C.muted2, textAlign: 'center', marginTop: 16 }}>
              No spam. No credit card. Your code arrives within 5 minutes.
            </p>
          </div>

          {/* Spots counter */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 36, flexWrap: 'wrap' }}>
            {[
              { val: '100', label: 'Total Pro Spots' },
              { val: '30', label: 'Days Free Access' },
              { val: '5/day', label: 'Free Tier Always' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.cyan }}>{item.val}</div>
                <div style={{ fontSize: 12, color: C.muted2, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── PRIVACY ── */}
      <section style={s.sectionSm}>
        <div style={{ ...s.cardGlow, maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #1ED760, transparent)', borderRadius: '20px 20px 0 0' }} />
          <span style={{ ...s.label, color: C.success }}>Privacy First</span>
          <h2 style={{ ...s.h2, fontSize: 30, marginBottom: 28 }}>Your email content stays private. Always.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {PRIVACY_YES.map((text) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckIcon />
                <span style={{ fontSize: 14, color: '#a8e6bc' }}>{text}</span>
              </div>
            ))}
            {PRIVACY_NO.map((text) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <XIcon />
                <span style={{ fontSize: 14, color: '#ffb3b3' }}>{text}</span>
              </div>
            ))}
          </div>
          <a href="/privacy" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, fontSize: 13, color: C.success, fontWeight: 600 }}>
            Read our full Privacy Policy
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#1ED760" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── PRICING ── */}
      <section id="pricing" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={s.label}>Pricing</span>
          <h2 style={s.h2}>Start free, unlock more<br />with a promo code</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 760, margin: '0 auto' }}>

          {/* Free */}
          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10 }}>Free Forever</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: C.white, marginBottom: 6, lineHeight: 1 }}>$0</div>
            <div style={{ fontSize: 13, color: C.muted2, marginBottom: 32 }}>Always free · No card needed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              {[
                '5 email analyses per day',
                'Full Mercury-2 AI analysis',
                'All 5 security modules',
                'VirusTotal + Safe Browsing + PhishTank',
                'Local history (last 20)',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckIcon color={C.cyan} />
                  <span style={{ fontSize: 14, color: C.muted }}>{f}</span>
                </div>
              ))}
            </div>
            <a
              href="https://chromewebstore.google.com"
              target="_blank" rel="noopener noreferrer"
              style={{ ...s.btnOutline, justifyContent: 'center', width: '100%', textAlign: 'center' as const }}
            >
              Install Free
            </a>
          </div>

          {/* Pro */}
          <div style={{ ...s.cardGlow, position: 'relative' as const }}>
            <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #39B6FF, transparent)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #39B6FF, #1F8DFF)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              EARLY ACCESS — LIMITED SPOTS
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.cyan, marginBottom: 10 }}>Pro · Beta</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 52, fontWeight: 800, color: C.white, lineHeight: 1 }}>Free</span>
            </div>
            <div style={{ fontSize: 13, color: C.muted2, marginBottom: 8 }}>30 days with promo code</div>
            <div style={{ fontSize: 12, color: C.cyan, marginBottom: 28, background: 'rgba(57,182,255,0.08)', padding: '6px 12px', borderRadius: 8, display: 'inline-block' }}>
              $4.99/mo after launch · ₦7,500/mo (Paystack)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              {[
                'Unlimited email analyses',
                'Full Mercury-2 AI analysis',
                'All 5 security modules',
                'VirusTotal + Safe Browsing + PhishTank + URLhaus',
                'Priority analysis queue',
                'Extended history (30 entries)',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckIcon color={C.cyan} />
                  <span style={{ fontSize: 14, color: C.muted }}>{f}</span>
                </div>
              ))}
            </div>
            <a
              href="#early-access"
              style={{ ...s.btnPrimary, justifyContent: 'center', width: '100%', textAlign: 'center' as const }}
            >
              Get Your Promo Code
            </a>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── FAQ ── */}
      <section id="faq" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={s.label}>FAQ</span>
          <h2 style={s.h2}>Common questions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 20, maxWidth: 980, margin: '0 auto' }}>
          {FAQS.map((faq) => (
            <div key={faq.q} style={s.card}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ color: C.cyan, fontWeight: 700, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>Q</span>
                <h3 style={{ ...s.h3, fontSize: 15, margin: 0, lineHeight: 1.4 }}>{faq.q}</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: C.muted2, fontWeight: 700, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>A</span>
                <p style={{ ...s.body, fontSize: 14 }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <GridBg />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(57,182,255,0.1) 0%, transparent 60%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <GuardScopeLogo size={56} showText={false} />
          </div>
          <h2 style={{ ...s.h2, marginBottom: 18 }}>
            Inspect before you trust.
          </h2>
          <p style={{ ...s.lead, margin: '0 auto 36px', fontSize: 17 }}>
            Install GuardScope free today. No account required to get started.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#early-access" style={{ ...s.btnPrimary, fontSize: 16, padding: '15px 32px' }}>
              Claim Early Access
            </a>
            <a
              href="https://chromewebstore.google.com"
              target="_blank" rel="noopener noreferrer"
              style={{ ...s.btnOutline, fontSize: 16, padding: '15px 32px' }}
            >
              Install Free
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(57,182,255,0.1)', padding: '36px 24px' }}>
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <GuardScopeLogo size={28} textSize={15} />
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="/privacy" style={{ fontSize: 13, color: C.muted2, transition: 'color .2s' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: 13, color: C.muted2 }}>Terms of Service</a>
            <a href="mailto:support@guardscope.io" style={{ fontSize: 13, color: C.muted2 }}>Support</a>
          </div>
          <p style={{ fontSize: 12, color: C.muted2 }}>© 2026 GuardScope · Inspect before you trust.</p>
        </div>
      </footer>
    </>
  )
}
