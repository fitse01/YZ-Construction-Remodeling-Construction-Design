import { getTransporter, sendNotificationToOwner } from '../services/email.service';

export const sendContactEmail = async (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) => {
  return sendNotificationToOwner({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    projectType: 'Contact Form Submission',
    message: data.message,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const baseUrl = process.env.ADMIN_DASHBOARD_URL || process.env.FRONTEND_URL || 'https://yzbconstruction.com';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
  const fromAddress = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

  const transporter = getTransporter();
  if (!transporter) {
    console.error('❌ Cannot send password reset email: SMTP is not configured.');
    throw new Error('SMTP is not configured');
  }

  const textContent = `
PASSWORD RESET REQUEST - YZ CONSTRUCTION
========================================

You requested a password reset for your YZ Construction account.

Click or copy the link below to reset your password:
${resetUrl}

This link will expire in 1 hour. If you did not make this request, please ignore this email.
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Request</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f5f7;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#0f172a;padding:24px 30px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">YZ Construction</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;">Password Reset Request</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                You requested a password reset for your YZ Construction admin account. Click the button below to set a new password:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#0284c7;word-break:break-all;">
                <a href="${resetUrl}" style="color:#0284c7;">${resetUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                This link expires in 1 hour. If you did not request this password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    await transporter.sendMail({
      from: `"YZ Construction" <${fromAddress}>`,
      to: email,
      subject: 'Password Reset Request - YZ Construction',
      text: textContent,
      html: htmlContent,
    });
    console.log(`✉️ Password reset email sent successfully to ${email}`);
  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error.message || error);
    throw error;
  }
};

export default { sendContactEmail, sendPasswordResetEmail };

