const nodemailer = require('nodemailer');
const https = require('https');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'parvez301@gmail.com';

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || (port === 465);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 8000
  });
}

function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
}

/**
 * Send an email via Resend HTTPS REST API (Port 443 - works on all Cloud Hosts including Render Free Tier)
 */
function sendViaResend(apiKey, { to, from, subject, html, text }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: from || 'BizProject Notifications <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    });

    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, messageId: json.id });
          } else {
            reject(new Error(json.message || `Resend API returned HTTP ${res.statusCode}: ${body}`));
          }
        } catch (parseErr) {
          reject(new Error(`Resend API error: ${body || res.statusCode}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Resend API request timed out after 10s'));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Send an email notification to the administrator when a new user registers
 * @param {Object} newUser - Details of the newly registered user
 */
async function notifyAdminNewUser(newUser) {
  try {
    const appUrl = process.env.APP_URL || 'https://bizproject.biznessimpact.com';
    const subject = `🔔 New User Registered: ${newUser.full_name || 'Member'} (${newUser.email})`;
    const textContent = `New user registration on BizProject:\n\nName: ${newUser.full_name}\nEmail: ${newUser.email}\nDepartment: ${newUser.department || 'General'}\nDesignation: ${newUser.designation || 'Team Member'}\nAuth Method: ${newUser.auth_provider || 'Password'}\nTime: ${new Date().toLocaleString()}\nDashboard: ${appUrl}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #10b981;">BizProject Enterprise Notification</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">New Member Registration Alert</p>
          </div>
          
          <div style="padding: 24px;">
            <p style="font-size: 15px; line-height: 1.5; margin-top: 0;">
              Hello Admin,
            </p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
              A new user has just registered an account on your <strong>BizProject</strong> platform. Here are the account details:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 140px;">Full Name:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${escapeHtml(newUser.full_name || 'N/A')}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Email Address:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">
                    <a href="mailto:${escapeHtml(newUser.email)}" style="color: #059669; text-decoration: none;">${escapeHtml(newUser.email)}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Department:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${escapeHtml(newUser.department || 'General')}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Designation:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${escapeHtml(newUser.designation || 'Team Member')}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Auth Method:</td>
                  <td style="padding: 10px 0; color: #0f172a; text-transform: capitalize;">${escapeHtml(newUser.auth_provider || 'Password')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Registration Time:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${new Date().toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            <div style="margin-top: 24px; text-align: center;">
              <a href="${appUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                Open Team Directory
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
            This automated alert was sent to administrator (${ADMIN_EMAIL}) by BizProject.
          </div>
        </div>
      </div>
    `;

    // 1. Prefer Resend API if configured (HTTPS REST API, bypasses cloud host SMTP port blocks)
    if (process.env.RESEND_API_KEY) {
      console.log(`[Email] Dispatching via Resend HTTPS API to ${ADMIN_EMAIL}...`);
      let resendFrom = process.env.RESEND_FROM || process.env.EMAIL_FROM;
      // Resend requires verified domains or onboarding@resend.dev for test delivery
      if (!resendFrom || resendFrom.includes('@gmail.') || resendFrom.includes('@yahoo.') || resendFrom.includes('@hotmail.')) {
        resendFrom = 'BizProject <onboarding@resend.dev>';
      }

      const resendResult = await sendViaResend(process.env.RESEND_API_KEY, {
        to: ADMIN_EMAIL,
        from: resendFrom,
        subject,
        html: htmlContent,
        text: textContent
      });
      console.log(`[Email] Notification sent via Resend API! ID: ${resendResult.messageId}`);
      return resendResult;
    }

    // 2. Fallback to standard SMTP / Nodemailer (works on local and hosts with open SMTP ports)
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[Email] Mailer not configured (missing RESEND_API_KEY or SMTP_HOST in .env). Skipped admin registration email for "${newUser.email}".`);
      return { success: false, reason: 'unconfigured' };
    }

    const fromAddress = process.env.EMAIL_FROM || `"BizProject System" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: ADMIN_EMAIL,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[Email] Admin registration notification sent to ${ADMIN_EMAIL} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send new user registration email to admin:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send an email confirmation/verification link to a newly registered user
 * @param {Object} user - Details of the new user (email, full_name, verifyToken)
 */
async function sendUserConfirmationEmail(user) {
  try {
    const appUrl = (process.env.APP_URL || 'https://bizproject.biznessimpact.com').replace(/\/$/, '');
    const verifyLink = `${appUrl}/?verify_token=${encodeURIComponent(user.verifyToken)}&email=${encodeURIComponent(user.email)}`;
    const subject = `Welcome to BizProject — Please Confirm Your Email`;
    const textContent = `Hello ${user.full_name || 'Member'},\n\nThank you for signing up for BizProject! Please confirm your email address by clicking the link below or copying it into your browser:\n\n${verifyLink}\n\nIf you did not sign up for this account, you can safely ignore this email.\n\nWarm regards,\nBizProject Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #10b981;">BizProject Workspace</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Email Confirmation</p>
          </div>
          
          <div style="padding: 24px;">
            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">
              Hello ${escapeHtml(user.full_name || 'there')},
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Thank you for registering on <strong>BizProject</strong>. To activate your account and start collaborating with your team, please confirm your email address:
            </p>
            
            <div style="margin: 28px 0; text-align: center;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 600; font-size: 15px; padding: 13px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                Confirm Email & Access Workspace
              </a>
            </div>

            <p style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
              If the button doesn't work, copy and paste this verification URL into your browser:<br/>
              <a href="${verifyLink}" style="color: #059669; word-break: break-all;">${verifyLink}</a>
            </p>
          </div>
          
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
            Sent by BizProject. If you didn't create an account, you can safely disregard this message.
          </div>
        </div>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      let resendFrom = process.env.RESEND_FROM || process.env.EMAIL_FROM;
      if (!resendFrom || resendFrom.includes('@gmail.') || resendFrom.includes('@yahoo.') || resendFrom.includes('@hotmail.')) {
        resendFrom = 'BizProject <onboarding@resend.dev>';
      }
      return await sendViaResend(process.env.RESEND_API_KEY, {
        to: user.email,
        from: resendFrom,
        subject,
        html: htmlContent,
        text: textContent
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[Email] Mailer not configured. Skipped confirmation email for "${user.email}".`);
      return { success: false, reason: 'unconfigured' };
    }

    const fromAddress = process.env.EMAIL_FROM || `"BizProject System" <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: user.email,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[Email] User confirmation email sent to ${user.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send user confirmation email:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a secure password reset link to user email
 * @param {Object} user - Details of the user (email, full_name, resetToken)
 */
async function sendPasswordResetEmail(user) {
  try {
    const appUrl = (process.env.APP_URL || 'https://bizproject.biznessimpact.com').replace(/\/$/, '');
    const resetLink = `${appUrl}/?reset_token=${encodeURIComponent(user.resetToken)}&email=${encodeURIComponent(user.email)}`;
    const subject = `Reset Your BizProject Password`;
    const textContent = `Hello ${user.full_name || 'Member'},\n\nA password reset request was made for your BizProject account. Please click the link below to set a new password:\n\n${resetLink}\n\nThis reset link is valid for 1 hour. If you did not request a password reset, you can safely ignore this message.\n\nWarm regards,\nBizProject Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #10b981;">BizProject Workspace</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Password Reset Request</p>
          </div>
          
          <div style="padding: 24px;">
            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">
              Hello ${escapeHtml(user.full_name || 'there')},
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              We received a request to reset your password for your <strong>BizProject</strong> account. Click the button below to set a new password:
            </p>
            
            <div style="margin: 28px 0; text-align: center;">
              <a href="${resetLink}" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: 600; font-size: 15px; padding: 13px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);">
                Set New Password
              </a>
            </div>

            <p style="font-size: 12px; line-height: 1.5; color: #64748b;">
              <strong>Note:</strong> This link is valid for 1 hour. If you didn't ask to reset your password, no action is needed — your account remains completely secure.
            </p>

            <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${resetLink}" style="color: #059669; word-break: break-all;">${resetLink}</a>
            </p>
          </div>
          
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
            Sent by BizProject Security Team.
          </div>
        </div>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      let resendFrom = process.env.RESEND_FROM || process.env.EMAIL_FROM;
      if (!resendFrom || resendFrom.includes('@gmail.') || resendFrom.includes('@yahoo.') || resendFrom.includes('@hotmail.')) {
        resendFrom = 'BizProject <onboarding@resend.dev>';
      }
      return await sendViaResend(process.env.RESEND_API_KEY, {
        to: user.email,
        from: resendFrom,
        subject,
        html: htmlContent,
        text: textContent
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[Email] Mailer not configured. Skipped reset password email for "${user.email}".`);
      return { success: false, reason: 'unconfigured' };
    }

    const fromAddress = process.env.EMAIL_FROM || `"BizProject System" <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: user.email,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[Email] Password reset email sent to ${user.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send password reset email:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  isMailConfigured,
  notifyAdminNewUser,
  sendUserConfirmationEmail,
  sendPasswordResetEmail,
  ADMIN_EMAIL
};
