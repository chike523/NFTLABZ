import nodemailer, { Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type Mail from 'nodemailer/lib/mailer'
import { createAdminClient } from '@/lib/supabase/admin'

type RawSetting = {
  key: string
  value: string | null
}

export type EmailConfig = {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  fromEmail: string
  fromName: string
}

let cachedConfig: EmailConfig | null = null
let cachedTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null

const REQUIRED_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name'
]

async function fetchEmailSettings(): Promise<Record<string, string>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('category', 'email')

  if (error) {
    throw new Error(`Failed to fetch email settings: ${error.message}`)
  }

  const settings: Record<string, string> = {}
  ;(data as RawSetting[] | null)?.forEach(({ key, value }) => {
    settings[key] = value ?? ''
  })

  return settings
}

function buildEmailConfig(settings: Record<string, string>): EmailConfig {
  const missing = REQUIRED_KEYS.filter((key) => !settings[key])
  if (missing.length > 0) {
    throw new Error(`Missing email settings: ${missing.join(', ')}`)
  }

  const port = Number.parseInt(settings.smtp_port, 10)
  if (Number.isNaN(port)) {
    throw new Error('SMTP port is invalid')
  }

  const secure = port === 465

  return {
    host: settings.smtp_host,
    port,
    secure,
    auth: {
      user: settings.smtp_username,
      pass: settings.smtp_password
    },
    fromEmail: settings.smtp_from_email,
    fromName: settings.smtp_from_name
  }
}

function configsMatch(a: EmailConfig | null, b: EmailConfig): boolean {
  if (!a) return false
  return (
    a.host === b.host &&
    a.port === b.port &&
    a.secure === b.secure &&
    a.auth.user === b.auth.user &&
    a.auth.pass === b.auth.pass &&
    a.fromEmail === b.fromEmail &&
    a.fromName === b.fromName
  )
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const settings = await fetchEmailSettings()
  return buildEmailConfig(settings)
}

export async function getTransporter(): Promise<Transporter<SMTPTransport.SentMessageInfo>> {
  const config = await getEmailConfig()

  if (!configsMatch(cachedConfig, config) || !cachedTransporter) {
    cachedConfig = config
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    })
  }

  return cachedTransporter
}

export async function sendMail(options: Mail.Options) {
  const transporter = await getTransporter()
  const config = cachedConfig ?? (await getEmailConfig())

  const mailOptions: Mail.Options = {
    from: options.from ?? `"${config.fromName}" <${config.fromEmail}>`,
    ...options
  }

  return transporter.sendMail(mailOptions)
}


