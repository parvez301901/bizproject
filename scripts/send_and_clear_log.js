const fs = require('fs');
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const logPath = path.resolve(__dirname, '../error.log');

  // 1. Create error log if not present or empty
  const simulatedError = `[${new Date().toISOString()}] [SYSTEM_DIAGNOSTIC] Simulated error logged for alert test.\nError: Simulated unhandled rejection in background task.\n    at testTask (f:\\antigravity\\bizproject\\server\\index.js:100:12)\n`;
  fs.writeFileSync(logPath, simulatedError, 'utf8');
  console.log('Error log created at:', logPath);

  const errorContent = fs.readFileSync(logPath, 'utf8');

  // 2. Configure mailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || (parseInt(process.env.SMTP_PORT || '587', 10) === 465),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    socketTimeout: 10000
  });

  const recipient = process.env.ADMIN_EMAIL || 'parvez301@gmail.com';
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  console.log(`Sending error log to developer (${recipient})...`);
  const info = await transporter.sendMail({
    from,
    to: recipient,
    subject: '[BizProject] Error Log Notification',
    text: `System error log report:\n\n${errorContent}`,
    html: `<h3>BizProject Error Log Alert</h3><p>The following log was recorded and dispatched:</p><pre style="background:#f1f5f9;padding:12px;border-radius:6px;font-family:monospace;">${errorContent}</pre>`
  });

  console.log('Email sent successfully! Message ID:', info.messageId);

  // 3. Clear error log
  fs.writeFileSync(logPath, '', 'utf8');
  console.log('Error log cleared successfully. Bytes remaining:', fs.statSync(logPath).size);
}

main().catch(err => {
  console.error('Operation failed:', err);
  process.exit(1);
});
