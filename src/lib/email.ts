// ─── Resend Email Integration ────────────────────────────────────────────────

const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || 'Davinci AI <noreply@davinci.ai>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend API error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

/**
 * Send a magic link verification email
 */
export async function sendVerificationEmail(email: string, url: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #10b981; font-size: 24px; margin: 0;">Davinci AI</h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Sign in to your account</h2>
        <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to sign in to your Davinci AI account. This link will expire in 24 hours.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${url}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Sign In
          </a>
        </div>
        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5;">
          If you didn't request this email, you can safely ignore it. The link will expire automatically.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
        <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
          Davinci AI — Your AI-powered content platform
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Sign in to Davinci AI',
    html,
  });
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #10b981; font-size: 24px; margin: 0;">Davinci AI</h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Welcome, ${name}! 🎉</h2>
        <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          Your account has been created successfully. Here's what you can do with Davinci AI:
        </p>
        <ul style="color: #52525b; font-size: 14px; line-height: 2; padding-left: 20px; margin-bottom: 24px;">
          <li>Generate text content with 60+ templates</li>
          <li>Create AI images with FLUX and Stable Diffusion</li>
          <li>Chat with multiple AI assistants</li>
          <li>Generate and explain code</li>
          <li>Transcribe audio and generate speech</li>
        </ul>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Go to Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
        <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
          Davinci AI — Your AI-powered content platform
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Davinci AI! 🚀',
    html,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #10b981; font-size: 24px; margin: 0;">Davinci AI</h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your password. Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
        </div>
        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
        <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
          Davinci AI — Your AI-powered content platform
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Davinci AI password',
    html,
  });
}
