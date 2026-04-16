import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import nodemailer, { type Transporter } from "nodemailer"

type PasswordResetEmailInput = {
  to: string
  name: string
  resetUrl: string
}

type EmailTransport = "ses-api" | "smtp"

type SesApiConfig = {
  region: string
  fromEmail: string
}

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromEmail: string
}

export type EmailDiagnostics = {
  configured: boolean
  transport: EmailTransport
  region: string | null
  smtpHost: string | null
  fromEmail: string | null
  missing: string[]
}

function normalizeAwsRegion(rawRegion: string) {
  const trimmed = rawRegion.trim()
  if (!trimmed) {
    return null
  }

  const smtpHostMatch = trimmed.match(/^email-smtp\.([a-z0-9-]+)\.amazonaws\.com$/i)
  if (smtpHostMatch?.[1]) {
    return smtpHostMatch[1]
  }

  if (/^[a-z]{2}-[a-z]+-\d+$/.test(trimmed)) {
    return trimmed
  }

  return null
}

function resolveTransport() {
  const raw = process.env.EMAIL_TRANSPORT?.trim().toLowerCase()
  if (raw === "smtp") {
    return "smtp" as const
  }
  if (raw === "ses" || raw === "ses-api") {
    return "ses-api" as const
  }

  return process.env.SMTP_HOST ? ("smtp" as const) : ("ses-api" as const)
}

function getSesApiConfig() {
  const rawRegion = process.env.AWS_REGION
  const region = rawRegion ? normalizeAwsRegion(rawRegion) : null
  const fromEmail = process.env.SES_FROM_EMAIL?.trim() ?? ""

  const missing: string[] = []
  if (!rawRegion) {
    missing.push("AWS_REGION")
  } else if (!region) {
    missing.push("AWS_REGION(valid region format, e.g. us-east-1)")
  }
  if (!fromEmail) {
    missing.push("SES_FROM_EMAIL")
  }

  const config = region && fromEmail ? ({ region, fromEmail } satisfies SesApiConfig) : null
  return { config, missing }
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() ?? ""
  const user = process.env.SMTP_USERNAME?.trim() ?? ""
  const pass = process.env.SMTP_PASSWORD?.trim() ?? ""
  const fromEmail =
    process.env.SMTP_FROM_EMAIL?.trim() ?? process.env.SES_FROM_EMAIL?.trim() ?? ""
  const portRaw = process.env.SMTP_PORT?.trim() ?? "587"
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase() ?? "false"

  const parsedPort = Number(portRaw)
  const port = Number.isFinite(parsedPort) ? parsedPort : 587
  const secure = secureRaw === "true" || port === 465

  const missing: string[] = []
  if (!host) missing.push("SMTP_HOST")
  if (!user) missing.push("SMTP_USERNAME")
  if (!pass) missing.push("SMTP_PASSWORD")
  if (!fromEmail) missing.push("SMTP_FROM_EMAIL or SES_FROM_EMAIL")

  const config =
    host && user && pass && fromEmail
      ? ({ host, port, secure, user, pass, fromEmail } satisfies SmtpConfig)
      : null

  return { config, missing }
}

export function getEmailDiagnostics(): EmailDiagnostics {
  const transport = resolveTransport()
  const ses = getSesApiConfig()
  const smtp = getSmtpConfig()

  if (transport === "smtp") {
    return {
      configured: Boolean(smtp.config),
      transport,
      region: ses.config?.region ?? null,
      smtpHost: smtp.config?.host ?? process.env.SMTP_HOST?.trim() ?? null,
      fromEmail: smtp.config?.fromEmail ?? null,
      missing: smtp.missing,
    }
  }

  return {
    configured: Boolean(ses.config),
    transport,
    region: ses.config?.region ?? null,
    smtpHost: smtp.config?.host ?? process.env.SMTP_HOST?.trim() ?? null,
    fromEmail: ses.config?.fromEmail ?? null,
    missing: ses.missing,
  }
}

function getAwsCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim()

  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      sessionToken: sessionToken || undefined,
    }
  }

  return undefined
}

let sesClient: SESv2Client | null = null
let sesClientRegion: string | null = null

function getSesClient(region: string) {
  if (!sesClient || sesClientRegion !== region) {
    sesClient = new SESv2Client({
      region,
      credentials: getAwsCredentials(),
    })
    sesClientRegion = region
  }

  return sesClient
}

let smtpTransporter: Transporter | null = null
let smtpTransportKey: string | null = null

function getSmtpTransporter(config: SmtpConfig) {
  const key = `${config.host}:${config.port}:${config.secure ? "secure" : "starttls"}:${config.user}`
  if (!smtpTransporter || smtpTransportKey !== key) {
    smtpTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })
    smtpTransportKey = key
  }

  return smtpTransporter
}

function buildResetEmailContent(input: PasswordResetEmailInput) {
  const subject = "Reset your Shelf password"
  const textBody = [
    `Hi ${input.name},`,
    "",
    "We received a request to reset your Shelf password.",
    "Use the link below to set a new password:",
    input.resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n")

  const htmlBody = `
    <p>Hi ${input.name},</p>
    <p>We received a request to reset your Shelf password.</p>
    <p><a href="${input.resetUrl}">Reset your password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `

  return { subject, textBody, htmlBody }
}

async function sendViaSesApi(input: PasswordResetEmailInput, config: SesApiConfig) {
  const client = getSesClient(config.region)
  const { subject, textBody, htmlBody } = buildResetEmailContent(input)

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: config.fromEmail,
      Destination: {
        ToAddresses: [input.to],
      },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: textBody, Charset: "UTF-8" },
            Html: { Data: htmlBody, Charset: "UTF-8" },
          },
        },
      },
    })
  )
}

async function sendViaSmtp(input: PasswordResetEmailInput, config: SmtpConfig) {
  const transporter = getSmtpTransporter(config)
  const { subject, textBody, htmlBody } = buildResetEmailContent(input)

  await transporter.sendMail({
    from: config.fromEmail,
    to: input.to,
    subject,
    text: textBody,
    html: htmlBody,
  })
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const diagnostics = getEmailDiagnostics()
  const smtp = getSmtpConfig()
  const ses = getSesApiConfig()

  if (!diagnostics.configured) {
    throw new Error(`Missing/invalid email configuration: ${diagnostics.missing.join(", ")}`)
  }

  if (diagnostics.transport === "smtp") {
    if (!smtp.config) {
      throw new Error(`Missing/invalid SMTP configuration: ${smtp.missing.join(", ")}`)
    }
    await sendViaSmtp(input, smtp.config)
    return
  }

  if (!ses.config) {
    throw new Error(`Missing/invalid SES API configuration: ${ses.missing.join(", ")}`)
  }

  try {
    await sendViaSesApi(input, ses.config)
  } catch (error) {
    // Fallback to SMTP if configured when SES API signing/credential issues occur.
    const message = error instanceof Error ? error.message : String(error)
    const smtpConfig = smtp.config
    const canFallbackToSmtp =
      smtpConfig &&
      (message.includes("InvalidSignatureException") || message.includes("The security token included in the request is invalid"))

    if (!canFallbackToSmtp) {
      throw error
    }

    await sendViaSmtp(input, smtpConfig)
  }
}
