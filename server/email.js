const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'parvez301@gmail.com';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'false' ? false : (port === 465);

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
    }
  });
}

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Send an email notification to the administrator when a new user registers
 * @param {Object} newUser - Details of the newly registered user
 */
async function notifyAdminNewUser(newUser) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[Email] Mailer not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS in .env). Skipped admin registration email for "${newUser.email}".`);
      return { success: false, reason: 'unconfigured' };
    }

    const fromAddress = process.env.EMAIL_FROM || `"BizProject System" <${process.env.SMTP_USER}>`;
    const appUrl = process.env.APP_URL || 'https://bizproject.biznessimpact.com';

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
                  <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${newUser.full_name || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Email Address:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">
                    <a href="mailto:${newUser.email}" style="color: #059669; text-decoration: none;">${newUser.email}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Department:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${newUser.department || 'General'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Designation:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${newUser.designation || 'Team Member'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Auth Method:</td>
                  <td style="padding: 10px 0; color: #0f172a; text-transform: capitalize;">${newUser.auth_provider || 'Password'}</td>
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

    const info = await transporter.sendMail({
      from: fromAddress,
      to: ADMIN_EMAIL,
      subject: `🔔 New User Registered: ${newUser.full_name || 'Member'} (${newUser.email})`,
      text: `New user registration on BizProject:\n\nName: ${newUser.full_name}\nEmail: ${newUser.email}\nDepartment: ${newUser.department}\nDesignation: ${newUser.designation}\nTime: ${new Date().toLocaleString()}`,
      html: htmlContent
    });

    console.log(`[Email] Admin registration notification sent to ${ADMIN_EMAIL} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send new user registration email to admin:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  isMailConfigured,
  notifyAdminNewUser,
  ADMIN_EMAIL
};
