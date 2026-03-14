/**
 * Disposable Email Detection — deterministic, zero external dependency.
 *
 * Uses an embedded list of known disposable/temporary email domains.
 * Source data: community-maintained open-source lists (MIT licensed).
 *
 * Why NOT emailrep.io: their free tier is non-commercial only. GuardScope is a
 * commercial product — using a third-party reputation API requires a commercial
 * license agreement. This deterministic approach has no ToS constraints.
 *
 * What this covers:
 *   - disposable: known throwaway email services (mailinator, guerrillamail, etc.)
 *   - The blacklisted/suspicious signals are covered by SpamHaus DBL + VT + SB
 *
 * Note: The EmailRepResult interface is preserved so the rest of the codebase
 * (scorer.ts, route.ts) works unchanged. suspicious/blacklisted/maliciousActivity
 * always return false here — those signals come from SpamHaus and threat intel.
 */

import type { EmailRepResult } from './types'

// Known disposable / temporary email service domains.
// These services provide throwaway addresses — commonly used in fraud and spam.
// Curated from open-source community lists (no commercial restriction).
const DISPOSABLE_DOMAINS = new Set([
  // High-volume throwaway services
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamailblock.com',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'throwam.com',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'sharklasers.com', 'guerrillamail.biz', 'spam4.me', 'trashmail.com',
  'trashmail.me', 'trashmail.net', 'trashmail.at', 'trashmail.io',
  'trashmail.org', 'trashmail.xyz', 'mailnull.com', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org', 'binkmail.com', 'bobmail.info',
  'chammy.info', 'devnullmail.com', 'deagot.com', 'drdrb.com',
  'dump-email.info', 'dumpmail.de', 'dumpyemail.com', 'e4ward.com',
  'email60.com', 'emailias.com', 'emailinfive.com', 'emailsensei.com',
  'emailtemporario.com.br', 'emailwarden.com', 'emailx.at.hm',
  'fakeinbox.com', 'fakeinbox.net', 'fakeinbox.org', 'fakemailgenerator.com',
  'fastacura.com', 'fastmazda.com', 'fastnissan.com', 'fasttoyota.com',
  'filzmail.com', 'fizmail.com', 'fleckens.hu', 'frapmail.com',
  'garliclife.com', 'get1mail.com', 'getonemail.com', 'ghosttexter.de',
  'girlsundertheinfluence.com', 'gowikibooks.com', 'gowikicampus.com',
  'gowikicars.com', 'gowikifilms.com', 'gowikigames.com', 'gowikimusic.com',
  'gowikinetwork.com', 'gowikitravel.com', 'gowikitv.com',
  'great-host.in', 'greensloth.com', 'guerillamail.biz',
  'h8s.org', 'haltospam.com', 'hatespam.org',
  'herp.in', 'hidemail.de', 'hidzz.com', 'hmamail.com',
  'hopemail.biz', 'hurify1.com',
  'ieh-mail.de', 'ihateyoualot.info', 'iheartspam.org',
  'imails.info', 'inoutmail.de', 'inoutmail.eu', 'inoutmail.info', 'inoutmail.net',
  'ipoo.org', 'irish2me.com', 'iwi.net',
  'jetable.com', 'jetable.net', 'jetable.org', 'jetable.pp.ua',
  'jnxjn.com', 'jobbikez.hu', 'jourrapide.com',
  'kasmail.com', 'kaspop.com', 'killmail.com', 'killmail.net',
  'klassmaster.com', 'klzlk.com', 'koszmail.pl',
  'kurzepost.de', 'letthemeatspam.com', 'lhsdv.com',
  'lifebyfood.com', 'link2mail.net', 'litedrop.com',
  'lol.ovpn.to', 'lookugly.com', 'lortemail.dk',
  'lr78.com', 'lroid.com', 'lukop.dk',
  'm21.cc', 'mail-filter.com', 'mail-temporaire.fr', 'mail.mezimages.net',
  'mail1a.de', 'mail21.cc', 'mail2rss.org', 'mail333.com',
  'mail4trash.com', 'mailbidon.com', 'mailbiz.biz', 'mailblocks.com',
  'mailbucket.org', 'mailcat.biz', 'mailcatch.com', 'mailde.de', 'mailde.info',
  'mailexpire.com', 'mailf5.com', 'mailfall.com', 'mailfreeonline.com',
  'mailguard.me', 'mailin8r.com', 'mailincubator.com', 'mailismagic.com',
  'mailme.ir', 'mailme.lv', 'mailme24.com', 'mailmetrash.com',
  'mailmoat.com', 'mailnew.com', 'mailnull.com', 'mailquack.com',
  'mailrock.biz', 'mailscrap.com', 'mailseal.de', 'mailshell.com',
  'mailsiphon.com', 'mailslapping.com', 'mailslite.com', 'mailsnd.com',
  'mailspeed.net', 'mailsponge.com', 'mailss.com', 'mailsucker.net',
  'mailt.com', 'mailtemp.info', 'mailtome.de', 'mailtothis.com',
  'mailtrash.net', 'mailtv.net', 'mailtv.tv', 'mailzilla.com',
  'mailzilla.org', 'makemetheking.com', 'manybrain.com', 'mbx.cc',
  'mega.zik.dj', 'meinspamschutz.de', 'meltmail.com',
  'messagebeamer.de', 'mezimages.net', 'ministry-of-silly-walks.de',
  'mintemail.com', 'misterpinball.de', 'moncourrier.fr.nf',
  'monemail.fr.nf', 'monmail.fr.nf', 'monumentmail.com',
  'mt2009.com', 'mt2014.com', 'mt2015.com', 'mx0.wwwnew.eu',
  'mycleaninbox.net', 'myemailboxy.com', 'mymail-in.net',
  'mypacks.net', 'mypartyclip.de', 'myphantomemail.com',
  'mysamp.de', 'mytempemail.com', 'mythirdage.com', 'mytrashmail.com',
  'nabuma.com', 'neomailbox.com', 'nepwk.com',
  'nervmich.net', 'nervtmich.net', 'netmails.com', 'netmails.net',
  'netzidiot.de', 'nh3.ro', 'nicknasty.com',
  'nineoclock.net', 'no-spam.ws', 'noblepioneer.com', 'nobulk.com',
  'noclickemail.com', 'nogmailspam.info', 'nomail.pw',
  'nomail.xl.cx', 'nomail2me.com', 'nomorespamemails.com',
  'nonspam.eu', 'nonspammer.de', 'noref.in', 'nospam.ze.tc',
  'nospam4.us', 'nospamfor.us', 'nospammail.net',
  'notmailinator.com', 'nowhere.org', 'nowmymail.com',
  'nwldx.com', 'objectmail.com', 'odaymail.com', 'oepia.com',
  'ogosms.com', 'okclprojects.com', 'oneoffmail.com',
  'onewaymail.com', 'onlatedotcom.info', 'online.ms',
  'opayq.com', 'ordinaryamerican.net', 'otherinbox.com',
  'ovpn.to', 'owlpic.com',
  'pancakemail.com', 'paplease.com', 'pcusers.otherinbox.com',
  'pepbot.com', 'pfui.ru', 'phentermine-mortgages.com',
  'pimpedupmyspace.com', 'pingvino.net', 'plexolan.de',
  'poczta.onet.pl', 'politikerclub.de', 'popesodomy.com',
  'poofy.org', 'pookmail.com', 'pop3.xyz',
  'postacin.com', 'powered.name', 'privy-mail.com',
  'privy-mail.de', 'proxymail.eu', 'prtnx.com',
  'punkass.com', 'putthisinyourspamdatabase.com',
  'qq.com',  // Chinese free mail provider, high abuse rate
  'quickinbox.com', 'quikmail.info', 'rcpt.at',
  'recode.me', 'recursor.net', 'reliable-mail.com',
  'remail.ga', 'rklips.com', 'rppkn.com',
  'rtrtr.com', 'ruffrey.com', 's0ny.net',
  'safe-mail.net', 'safersignup.de', 'safetymail.info',
  'safetypost.de', 'sandelf.de', 'sent.as',
  'services391.com', 'sharklasers.com', 'shieldedmail.com',
  'shieldemail.com', 'shiftmail.com', 'sibmail.com',
  'sinnlos-mail.de', 'slopsbox.com', 'smellfear.com',
  'snakemail.com', 'sneakemail.com', 'snkmail.com',
  'sofimail.com', 'sogetthis.com', 'soodonims.com',
  'spam4.me', 'spamail.de', 'spamass.com', 'spambob.com',
  'spambob.net', 'spambob.org', 'spambox.info', 'spambox.irishspringrealty.com',
  'spambox.us', 'spamcannon.com', 'spamcannon.net',
  'spamcero.com', 'spamcon.org', 'spamcorptastic.com',
  'spamcowboy.com', 'spamcowboy.net', 'spamcowboy.org',
  'spamday.com', 'spamdecoy.net', 'spamex.com',
  'spamfree.eu', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net', 'spamfree24.org', 'spamgoes.in',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'spamherelots.com', 'spamherelots.com', 'spamhereplease.com',
  'spamhole.com', 'spamify.com', 'spaminmotion.com',
  'spamkill.info', 'spaml.com', 'spaml.de', 'spammotel.com',
  'spamoff.de', 'spamslicer.com', 'spamspot.com',
  'spamstack.net', 'spamthis.co.uk', 'spamtroll.net',
  'spamtrapp.info', 'spamwc.de', 'speed.1s.fr',
  'spikio.com', 'spoofmail.de', 'sprint.ca',
  'stinkefinger.net', 'stuffmail.de', 'super-auswahl.de',
  'supergreatmail.com', 'supermailer.jp', 'superstachel.de',
  'suremail.info', 'svk.jp', 'sweetxxx.de',
  'taglead.com', 'tagyourself.com', 'teewars.org',
  'teleworm.com', 'teleworm.us', 'temp-mail.org', 'temp.emeraldwebmail.com',
  'tempail.com', 'tempalias.com', 'tempe-mail.com', 'tempemail.biz',
  'tempemail.co.za', 'tempemail.com', 'tempemail.net', 'tempinbox.co.uk',
  'tempinbox.com', 'tempmail.eu', 'tempmail.it', 'tempmail2.com',
  'tempomail.fr', 'temporaryemail.net', 'temporaryemail.us',
  'temporaryforwarding.com', 'temporaryinbox.com', 'temporarymailaddress.com',
  'tempthe.net', 'thankyou2010.com', 'thc.st',
  'thedoghousemail.com', 'theinternetemail.com', 'thisisnotmyrealemail.com',
  'throam.com', 'throwam.com', 'throwaway.email',
  'throwam.com', 'tilien.com', 'tmail.com',
  'tmailinator.com', 'toiea.com', 'tokmail.net',
  'tradermail.info', 'trash-amil.com', 'trash-mail.at',
  'trash-mail.com', 'trash-mail.de', 'trash-mail.ga', 'trash-mail.io',
  'trash-mail.ml', 'trash2009.com', 'trashdevil.com',
  'trashdevil.de', 'trashemail.de', 'trashimail.com',
  'trashmail.app', 'trashmail.at', 'trashmail.com',
  'trashmail.io', 'trashmail.me', 'trashmail.net',
  'trashmail.org', 'trashmailer.com', 'trashmailer.net',
  'trashmailer.org', 'trayna.com', 'trbvm.com',
  'trickmail.net', 'trillianpro.com', 'trnwxa.com',
  'trq.in', 'tsamail.co.za', 'turual.com',
  'twinmail.de', 'tyldd.com', 'ubm.md',
  'uggsrock.com', 'umail.net', 'uroid.com',
  'us.af', 'venompen.com', 'veryrealemail.com',
  'vidchart.com', 'viditag.com', 'viewcastmedia.com',
  'viewcastmedia.net', 'viewcastmedia.org', 'vinernet.com',
  'vkcode.ru', 'vmani.com', 'vomoto.com',
  'vp.ycare.de', 'vpn.st', 'vubby.com',
  'w3internet.co.uk', 'walala.org', 'walkmail.net',
  'walkmail.ru', 'wallm.com', 'webemail.me',
  'webm4il.info', 'webmail.kolmpuu.net', 'weg-werf-email.de',
  'wetrainbayarea.com', 'wetrainbayarea.org',
  'wh4f.org', 'whatiaas.com', 'whatpaas.com',
  'whatsaas.com', 'whopy.com', 'wilemail.com',
  'willhackforfood.biz', 'willselfdestruct.com', 'winemaven.info',
  'wronghead.com', 'wuzupmail.net', 'wwwnew.eu',
  'www2000.net', 'xagloo.com', 'xemaps.com',
  'xents.com', 'xmaily.com', 'xoxy.net',
  'xsecurity.org', 'xsmail.com', 'xww.ro',
  'xyzfree.net', 'yep.it', 'yogamaven.com',
  'yomail.info', 'yopmail.com', 'yopmail.fr',
  'yopmail.pp.ua', 'youmailr.com', 'ypmail.webarnak.fr.eu.org',
  'yuurok.com', 'z1p.biz', 'za.com',
  'zehnminuten.de', 'zehnminutenmail.de', 'zetmail.com',
  'zippymail.info', 'zoaxe.com', 'zoemail.net',
  'zoemail.org', 'zomg.info', 'zxcv.com',
])

// Heuristic patterns that strongly suggest disposable/throwaway email services
// even if the domain isn't in the explicit list above
const DISPOSABLE_KEYWORDS = [
  'tempmail', 'throwaway', 'trashmail', 'spammail', 'fakemail',
  'disposable', 'mailinator', 'guerrilla', 'yopmail', 'nomail',
  'nospam', 'dumpmail', 'trashemail', 'spamgourmet', 'mailnull',
  'discard', 'mailtemp', 'tempinbox', 'mailbucket',
]

/**
 * Check if an email address uses a known disposable email service.
 * Returns synchronously — no network call, no ToS concerns.
 *
 * Two-pronged approach:
 * 1. Explicit domain list (300+ known services)
 * 2. Heuristic pattern matching (keyword-based for new services)
 */
export function emailRepCheck(email: string): EmailRepResult {
  if (!email) {
    return { suspicious: false, blacklisted: false, disposable: false, maliciousActivity: false, spoofing: false }
  }

  const domain = email.toLowerCase().split('@')[1] ?? ''

  // Check 1: explicit domain list
  const inList = DISPOSABLE_DOMAINS.has(domain)

  // Check 2: heuristic keyword matching on the domain name
  const domainBase = domain.split('.')[0] ?? ''
  const heuristic = DISPOSABLE_KEYWORDS.some(kw => domainBase.includes(kw))

  const disposable = inList || heuristic

  return {
    suspicious: disposable,
    blacklisted: false,       // covered by SpamHaus DBL + VirusTotal + SB
    disposable,
    maliciousActivity: false, // covered by SpamHaus DBL + OTX
    spoofing: false,          // covered by Return-Path mismatch + display name checks
  }
}
