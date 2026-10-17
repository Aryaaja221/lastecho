const nodemailer = require('nodemailer');

// Read SMTP configuration from environment
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Support custom SMTP host or default to Gmail
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  }

  // Default Gmail transporter
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

function isEmailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

/**
 * Send the dispatched capsule notification to the recipient
 */
async function sendCapsuleEmail({ recipientName, recipientEmail, senderName, subject, deliveryType, token, baseUrl }) {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log(`[Mailer - Simulation] Credentials not set. Simulated email to ${recipientEmail} with token: ${token}`);
    return {
      success: false,
      simulated: true,
      message: 'SMTP credentials not configured. Dispatched in simulated mode.'
    };
  }

  const accessUrl = `${baseUrl || 'http://localhost:5000'}/view.html?token=${token}`;
  const senderDisplayName = senderName || 'LastEcho Protocol Account Owner';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LastEcho Digital Legacy</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0c111d; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0c111d; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #151e32; border-radius: 16px; border: 1px solid #293856; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="padding: 32px 36px; background: linear-gradient(135deg, #1e293b, #0f172a); border-bottom: 1px solid #293856;">
                <div style="font-size: 24px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                  🕊️ LastEcho <span style="font-size: 13px; font-weight: normal; color: #94a3b8; margin-left: 8px;">Protocol</span>
                </div>
                <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Automated Digital Closure & Confidential Legacy Protocol</div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px;">
                <h2 style="font-size: 20px; color: #f8fafc; margin-top: 0; margin-bottom: 16px;">
                  Dear ${recipientName},
                </h2>
                <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
                  This message is automatically delivered by the <strong>LastEcho Protocol</strong> as entrusted by <strong>${senderDisplayName}</strong>.
                </p>
                
                <div style="background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8; font-weight: 600;">Capsule Subject</div>
                  <div style="font-size: 16px; color: #f1f5f9; font-weight: 600; margin-top: 4px;">"${subject}"</div>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px;">
                  This protocol was executed because the vitality monitoring system (<em>Dead Man's Switch</em>) did not receive routine confirmation from the sender past the designated time threshold.
                </p>

                <!-- Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${accessUrl}" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);">
                    Open & Read Your Confidential Letter →
                  </a>
                </div>

                <div style="background: #0f172a; padding: 14px; border-radius: 8px; border: 1px dashed #334155; font-size: 12px; color: #64748b; line-height: 1.5;">
                  🔒 <strong>Cryptographic Security:</strong> This capsule is encrypted using military-grade AES-256 GCM. Only you possess the authorized access token to decrypt and view it.
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 36px; background: #0c111d; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #475569;">
                Delivered by <strong>LastEcho Protocol</strong> — Integrated Amazon Alexa Silent Guardian.<br>
                If you do not recognize the sender, you may safely disregard this message.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"LastEcho Protocol" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `🕊️ [LastEcho] Confidential Capsule from ${senderDisplayName}: "${subject}"`,
      html: htmlContent
    });

    console.log(`[Mailer] Real email successfully sent to ${recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
      recipientEmail
    };
  } catch (error) {
    console.error(`[Mailer] Error sending real email to ${recipientEmail}:`, error);
    return {
      success: false,
      simulated: false,
      error: error.message
    };
  }
}

/**
 * Test sending a sample email to verify credentials
 */
async function sendTestEmail(targetEmail) {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      message: 'Email credentials (EMAIL_USER / EMAIL_PASS) are not configured in the .env file.'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"LastEcho Protocol" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: '✅ [LastEcho] Live Email Dispatch Verification Successful!',
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; margin-top: 0;">🕊️ LastEcho Email Service is Live!</h2>
          <p>Hello! This is an automated test verifying that the Gmail/SMTP delivery service on your LastEcho installation is working with 100% fidelity.</p>
          <p style="color: #94a3b8;">When the Dead Man's Switch executes due to lack of Alexa voice check-in, sealed digital capsules will be automatically dispatched directly to beneficiaries like this email.</p>
          <hr style="border-color: #334155; margin: 20px 0;">
          <small style="color: #64748b;">Verification Timestamp: ${new Date().toUTCString()}</small>
        </div>
      `
    });

    return {
      success: true,
      messageId: info.messageId,
      message: `Verification email successfully dispatched to ${targetEmail}!`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  isEmailConfigured,
  sendCapsuleEmail,
  sendTestEmail
};
