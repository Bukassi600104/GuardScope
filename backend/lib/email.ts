import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  if (!resendClient) resendClient = new Resend(key)
  return resendClient
}

const FROM = process.env.EMAIL_FROM ?? 'GuardScope <onboarding@resend.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function shellHtml(opts: { preview: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(opts.preview)}</title>
</head>
<body style="margin:0;padding:0;background:#071c2c;font-family:Arial,Helvetica,sans-serif;color:#e7eef4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#071c2c;padding:40px 14px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <span style="font-size:21px;font-weight:800;color:#e7eef4;">Guard<span style="color:#39b6ff;">Scope</span></span>
            </td>
          </tr>
          <tr>
            <td style="background:#0a2338;border:1px solid rgba(57,182,255,0.22);border-radius:20px;padding:38px;">
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#6d8193;">2026 GuardScope. Inspect before you trust.</p>
              <p style="margin:0;font-size:12px;">
                <a href="${SITE}/privacy" style="color:#6d8193;text-decoration:underline;">Privacy</a>
                <span style="color:#6d8193;"> | </span>
                <a href="${SITE}/terms" style="color:#6d8193;text-decoration:underline;">Terms</a>
                <span style="color:#6d8193;"> | </span>
                <a href="mailto:support@guardscope.app" style="color:#6d8193;text-decoration:underline;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(opts: {
  to: string
  name: string
  code: string
  claimDeadline: Date
}): Promise<void> {
  const firstName = firstNameOf(opts.name)
  const safeFirstName = escapeHtml(firstName)
  const safeCode = escapeHtml(opts.code)
  const expiry = formatDate(opts.claimDeadline)

  const html = shellHtml({
    preview: 'Your GuardScope Early Access Code',
    body: `
      <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#39b6ff;">Early Access Pro Plan</p>
      <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#e7eef4;">You are in, ${safeFirstName}.</h1>
      <p style="margin:0 0 26px;font-size:16px;line-height:1.7;color:#9bb0c2;">Your GuardScope Early Access code gives you <strong style="color:#e7eef4;">30 days of full Pro access</strong> with AI-assisted email threat analysis and no payment required.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
        <tr>
          <td style="background:#071c2c;border:2px solid #39b6ff;border-radius:14px;padding:20px;text-align:center;">
            <p style="margin:0 0 7px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6d8193;">Your promo code</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#39b6ff;letter-spacing:0.06em;font-family:'Courier New',monospace;">${safeCode}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#6d8193;">Expires if unused by ${escapeHtml(expiry)}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 14px;font-size:15px;font-weight:800;color:#e7eef4;">How to activate</p>
      <ol style="margin:0 0 26px 20px;padding:0;color:#9bb0c2;font-size:14px;line-height:1.8;">
        <li>Install GuardScope from <a href="${SITE}" style="color:#39b6ff;text-decoration:none;">guardscope.app</a>.</li>
        <li>Create your account in the extension popup.</li>
        <li>Choose Upgrade to Pro, paste your code, and activate.</li>
      </ol>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#6d8193;border-top:1px solid rgba(57,182,255,0.12);padding-top:18px;">Your code is personal and single-use. Questions? Email <a href="mailto:support@guardscope.app" style="color:#39b6ff;text-decoration:none;">support@guardscope.app</a>.</p>
    `,
  })

  const text = `Hi ${firstName},

Your GuardScope Early Access code is ready.

PROMO CODE: ${opts.code}
Expires if unused by ${expiry}

How to activate:
1. Install GuardScope: ${SITE}
2. Create your account in the extension popup
3. Choose Upgrade to Pro, enter your code, and activate

Questions? support@guardscope.app

The GuardScope Team`

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `${opts.code} - Your GuardScope Pro Access Code`,
    html,
    text,
  })
}

export async function sendControlPanelRecoveryEmail(opts: {
  to: string
  username: string
  resetUrl: string
}): Promise<void> {
  const safeUsername = escapeHtml(opts.username)
  const safeResetUrl = escapeHtml(opts.resetUrl)

  const html = shellHtml({
    preview: 'Reset your GuardScope Control Panel password',
    body: `
      <h1 style="margin:0 0 14px;font-size:25px;line-height:1.2;color:#e7eef4;">Reset Control Panel password</h1>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#9bb0c2;">A password reset was requested for the GuardScope Control Panel owner account <strong style="color:#e7eef4;">${safeUsername}</strong>.</p>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#9bb0c2;">This link expires in 30 minutes. After changing the password, sign in again with the new password.</p>
      <a href="${safeResetUrl}" style="display:inline-block;background:#39b6ff;color:#061b2b;text-decoration:none;font-size:14px;font-weight:800;border-radius:8px;padding:13px 18px;">Change password</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6d8193;">If you did not request this reset, ignore this email.</p>
    `,
  })

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: 'Reset your GuardScope Control Panel password',
    html,
    text: `Reset your GuardScope Control Panel password for ${opts.username}: ${opts.resetUrl}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
  })
}

export async function sendRedemptionConfirmation(opts: {
  to: string
  name: string
  proExpiresAt: Date
}): Promise<void> {
  const firstName = firstNameOf(opts.name)
  const safeFirstName = escapeHtml(firstName)
  const expiry = formatDate(opts.proExpiresAt)

  const html = shellHtml({
    preview: 'GuardScope Pro Access Activated',
    body: `
      <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#1ed760;">Pro Access Activated</p>
      <h1 style="margin:0 0 18px;font-size:27px;line-height:1.2;color:#e7eef4;">Welcome to Pro, ${safeFirstName}.</h1>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#9bb0c2;">Your GuardScope account is now on the <strong style="color:#e7eef4;">Pro plan</strong> with <strong style="color:#1ed760;">unlimited email analyses</strong> until <strong style="color:#e7eef4;">${escapeHtml(expiry)}</strong>.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#9bb0c2;">Open Gmail in Chrome and start analyzing suspicious messages.</p>
    `,
  })

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: 'GuardScope Pro - Your access is now active',
    html,
    text: `Hi ${firstName},\n\nYour GuardScope Pro access is now active until ${expiry}.\n\nOpen Gmail in Chrome and start analyzing suspicious messages.\n\nGuardScope`,
  })
}
