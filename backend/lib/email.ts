import { Resend } from 'resend'

// Lazy-initialized to avoid module-level errors when RESEND_API_KEY is not set at build time
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'missing')
  return _resend
}

// Use a verified domain; fall back to Resend's default sender for development
const FROM = process.env.EMAIL_FROM ?? 'GuardScope <onboarding@resend.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://backend-gules-sigma-37.vercel.app'

// ─────────────────────────────────────────────────────────────
// Welcome email — sent when user requests a promo code
// ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(opts: {
  to: string
  name: string
  code: string
  claimDeadline: Date
}): Promise<void> {
  const { to, name, code, claimDeadline } = opts
  const firstName = name.split(' ')[0]
  const expiry = claimDeadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Your GuardScope Early Access Code</title>
</head>
<body style="margin:0;padding:0;background:#071C2C;font-family:'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#071C2C;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:0 0 32px 0;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#6DD5FA"/>
                        <stop offset="100%" stop-color="#1F8DFF"/>
                      </linearGradient>
                    </defs>
                    <path d="M 21.12 27.84 A 13 13 0 1 0 27.37 16.42" stroke="url(#g1)" stroke-width="4" stroke-linecap="round" fill="none"/>
                    <circle cx="20" cy="23" r="3.5" fill="#39B6FF"/>
                    <circle cx="31.4" cy="11.6" r="2.8" fill="#39B6FF"/>
                  </svg>
                </td>
                <td style="padding-left:10px;">
                  <span style="font-size:20px;font-weight:700;color:#E7EEF4;letter-spacing:-0.01em;">
                    <span style="color:#E7EEF4;">Guard</span><span style="color:#39B6FF;">Scope</span>
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#0a2338;border:1px solid rgba(57,182,255,0.2);border-radius:20px;padding:40px 40px 32px;">

            <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#39B6FF;">
              Early Access · Pro Plan
            </p>

            <h1 style="margin:0 0 20px 0;font-size:28px;font-weight:800;color:#E7EEF4;line-height:1.2;">
              You&rsquo;re in, ${firstName}! 🎉
            </h1>

            <p style="margin:0 0 28px 0;font-size:16px;color:#8ba3b8;line-height:1.7;">
              Your GuardScope Early Access code gives you <strong style="color:#E7EEF4;">30 days of full Pro access</strong> —
              unlimited email analyses, all AI + threat intel layers, zero payment required.
            </p>

            <!-- Code box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#071C2C;border:2px solid #39B6FF;border-radius:14px;padding:20px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4a6478;">
                    YOUR PROMO CODE
                  </p>
                  <p style="margin:0;font-size:32px;font-weight:800;color:#39B6FF;letter-spacing:0.06em;font-family:'Courier New',monospace;">
                    ${code}
                  </p>
                  <p style="margin:8px 0 0 0;font-size:12px;color:#4a6478;">
                    Expires if unused by ${expiry}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Steps -->
            <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#E7EEF4;">How to activate:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              ${[
                ['1', 'Install GuardScope', `<a href="${SITE}" style="color:#39B6FF;text-decoration:none;">Add it to Chrome</a> — it&rsquo;s free`],
                ['2', 'Create your account', 'Open the extension popup and sign up with your email'],
                ['3', 'Enter your code', 'Click "Upgrade to Pro" → paste your code above → activate'],
              ].map(([n, title, desc]) => `
              <tr>
                <td style="vertical-align:top;width:36px;padding-bottom:14px;">
                  <span style="display:inline-block;width:28px;height:28px;background:rgba(57,182,255,0.12);border-radius:8px;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#39B6FF;">${n}</span>
                </td>
                <td style="padding-bottom:14px;padding-left:12px;vertical-align:top;">
                  <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#E7EEF4;">${title}</p>
                  <p style="margin:0;font-size:13px;color:#8ba3b8;">${desc}</p>
                </td>
              </tr>`).join('')}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${SITE}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#39B6FF,#1F8DFF);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
                    Install GuardScope Free →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#4a6478;line-height:1.7;border-top:1px solid rgba(57,182,255,0.1);padding-top:20px;">
              Your code is personal and single-use. It cannot be transferred.
              Questions? Reply to this email or reach us at
              <a href="mailto:support@guardscope.io" style="color:#39B6FF;text-decoration:none;">support@guardscope.io</a>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:12px;color:#4a6478;">
              © 2026 GuardScope · Inspect before you trust.
            </p>
            <p style="margin:0;font-size:12px;">
              <a href="${SITE}/privacy" style="color:#4a6478;text-decoration:underline;">Privacy Policy</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/terms" style="color:#4a6478;text-decoration:underline;">Terms</a>
              &nbsp;·&nbsp;
              <a href="mailto:support@guardscope.io" style="color:#4a6478;text-decoration:underline;">Support</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`

  const text = `
Hi ${firstName},

Your GuardScope Early Access code is ready!

PROMO CODE: ${code}
(Expires if unused by ${expiry})

How to activate:
1. Install GuardScope: ${SITE}
2. Create your account in the extension popup
3. Click "Upgrade to Pro" → enter your code → activate

Questions? support@guardscope.io

— The GuardScope Team
`

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `${code} — Your GuardScope Pro Access Code`,
    html,
    text,
  })
}

// ─────────────────────────────────────────────────────────────
// Redemption confirmation — sent after code is successfully redeemed
// ─────────────────────────────────────────────────────────────
export async function sendRedemptionConfirmation(opts: {
  to: string
  name: string
  proExpiresAt: Date
}): Promise<void> {
  const { to, name, proExpiresAt } = opts
  const firstName = name.split(' ')[0]
  const expiry = proExpiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Pro Access Activated!</title></head>
<body style="margin:0;padding:0;background:#071C2C;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#071C2C;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <tr>
        <td align="center" style="padding:0 0 32px 0;">
          <span style="font-size:20px;font-weight:700;"><span style="color:#E7EEF4;">Guard</span><span style="color:#39B6FF;">Scope</span></span>
        </td>
      </tr>

      <tr>
        <td style="background:#0a2338;border:1px solid rgba(30,215,96,0.25);border-radius:20px;padding:40px;">
          <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#1ED760;">Pro Access Activated</p>
          <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:800;color:#E7EEF4;line-height:1.2;">
            Welcome to Pro, ${firstName}! ✅
          </h1>
          <p style="margin:0 0 24px 0;font-size:15px;color:#8ba3b8;line-height:1.7;">
            Your GuardScope account is now on the <strong style="color:#E7EEF4;">Pro plan</strong> with
            <strong style="color:#1ED760;">unlimited email analyses</strong> until <strong style="color:#E7EEF4;">${expiry}</strong>.
          </p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#8ba3b8;">
            Open Gmail in Chrome and start analyzing — GuardScope is ready.
          </p>
          <p style="margin:24px 0 0 0;font-size:13px;color:#4a6478;border-top:1px solid rgba(57,182,255,0.1);padding-top:20px;">
            Questions? <a href="mailto:support@guardscope.io" style="color:#39B6FF;text-decoration:none;">support@guardscope.io</a>
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:24px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#4a6478;">© 2026 GuardScope · Inspect before you trust.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: 'GuardScope Pro — Your access is now active ✅',
    html,
    text: `Hi ${firstName},\n\nYour GuardScope Pro access is now active until ${expiry}.\n\nOpen Gmail in Chrome and start analyzing emails.\n\n— GuardScope`,
  })
}
