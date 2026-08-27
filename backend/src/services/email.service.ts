import nodemailer from 'nodemailer';

export interface SendMessageEmailParams {
  name: string;
  email: string;
  phone?: string | null;
  projectType?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
}

export interface ReplyEmailParams {
  name: string;
  email: string;
  replyMessage: string;
}

export const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || '').trim();
  // App Passwords often have spaces when copied from Google (e.g. "abcd efgh ijkl mnop"), strip them
  const rawPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('⚠️ SMTP warning: SMTP_USER or SMTP_PASSWORD not set in environment.');
      return false;
    }

    await transporter.verify();
    console.log('✅ SMTP connection verified successfully (Nodemailer ready)');
    return true;
  } catch (error: any) {
    console.error('❌ SMTP verification failed:', error.message || error);
    return false;
  }
};

export const sendNotificationToOwner = async (data: SendMessageEmailParams): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const ownerEmail = (process.env.OWNER_EMAIL || process.env.SMTP_USER || '').trim();
    const fromAddress = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

    if (!transporter || !ownerEmail) {
      console.warn('⚠️ Cannot send email: SMTP transporter or OWNER_EMAIL is missing. Falling back to console log:');
      console.log('New Contact Message:', JSON.stringify(data, null, 2));
      return false;
    }

    const senderName = data.name || 'Anonymous';
    const senderEmail = data.email || 'No email provided';
    const senderPhone = data.phone || 'Not provided';
    const projectType = data.projectType || 'General Inquiry';
    const budget = data.budget || 'Not specified';
    const timeline = data.timeline || 'Not specified';
    const message = data.message || '';

    const subject = `🔨 New Contact Inquiry: ${senderName} (${projectType})`;

    const textContent = `
NEW WEBSITE INQUIRY - YZ CONSTRUCTION
=====================================

Client Name:  ${senderName}
Email:        ${senderEmail}
Phone:        ${senderPhone}
Project Type: ${projectType}
Budget:       ${budget}
Timeline:     ${timeline}

MESSAGE:
-------------------------------------
${message}
-------------------------------------

Submitted via https://yzbconstruction.com/contact
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Website Inquiry</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f5f7;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 30px;text-align:left;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                YZ Construction
              </h1>
              <p style="margin:4px 0 0 0;color:#94a3b8;font-size:13px;">
                New Website Lead & Contact Request
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600;">
                Inquiry Details
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;font-size:14px;width:130px;font-weight:500;">Client Name</td>
                  <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">${senderName}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;font-size:14px;font-weight:500;">Email</td>
                  <td style="padding:10px 0;color:#0284c7;font-size:14px;font-weight:500;">
                    <a href="mailto:${senderEmail}" style="color:#0284c7;text-decoration:none;">${senderEmail}</a>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;font-size:14px;font-weight:500;">Phone</td>
                  <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">
                    ${senderPhone !== 'Not provided' ? `<a href="tel:${senderPhone.replace(/[^0-9+]/g, '')}" style="color:#0f172a;text-decoration:none;">${senderPhone}</a>` : '<span style="color:#94a3b8;">Not provided</span>'}
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;font-size:14px;font-weight:500;">Project Type</td>
                  <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">${projectType}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;font-size:14px;font-weight:500;">Budget</td>
                  <td style="padding:10px 0;color:#0f172a;font-size:14px;">${budget}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#64748b;font-size:14px;font-weight:500;">Timeline</td>
                  <td style="padding:10px 0;color:#0f172a;font-size:14px;">${timeline}</td>
                </tr>
              </table>

              <!-- Message Box -->
              <div style="background-color:#f8fafc;border-left:4px solid #0284c7;padding:16px;border-radius:0 8px 8px 0;margin-top:10px;margin-bottom:24px;">
                <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${message}</p>
              </div>

              <!-- Quick Actions -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${senderEmail}?subject=Re:%20YZ%20Construction%20Inquiry" style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;margin-right:10px;">
                      Reply to ${senderName}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 30px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Sent automatically by YZ Construction website (<a href="https://yzbconstruction.com" style="color:#94a3b8;text-decoration:underline;">yzbconstruction.com</a>)
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

    const info = await transporter.sendMail({
      from: `"YZ Construction" <${fromAddress}>`,
      to: ownerEmail,
      replyTo: `"${senderName}" <${senderEmail}>`,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✉️ Owner notification email sent successfully! MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send owner email notification:', error.message || error);
    return false;
  }
};

export const sendConfirmationToClient = async (data: SendMessageEmailParams): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const fromAddress = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

    if (!transporter || !data.email) return false;

    const senderName = data.name || 'there';
    const projectType = data.projectType || 'your project';

    const textContent = `
Hello ${senderName},

Thank you for contacting YZ Construction! We have received your inquiry regarding ${projectType}.

Our team is reviewing your message and will get back to you within 1 business day to discuss your project details and schedule your free on-site consultation.

If your request is urgent, please call us directly at (240) 781-8778.

Best regards,
YZ Construction, LLC
Silver Spring, MD · (240) 781-8778
https://yzbconstruction.com
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting YZ Construction</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f5f7;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 30px;text-align:left;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                YZ Construction
              </h1>
              <p style="margin:4px 0 0 0;color:#94a3b8;font-size:13px;">
                Boutique Residential & Commercial Builder · DMV
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600;">
                Thank You for Reaching Out, ${senderName}!
              </h2>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#475569;">
                We have received your estimate request for <strong>${projectType}</strong>. Our team will review your project details and get in touch with you within one business day.
              </p>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                Need immediate assistance? Feel free to give us a call directly at <a href="tel:2407818778" style="color:#0284c7;font-weight:600;text-decoration:none;">(240) 781-8778</a>.
              </p>
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#64748b;">
                <strong>YZ Construction, LLC</strong><br>
                Silver Spring, MD · (240) 781-8778<br>
                <a href="https://yzbconstruction.com" style="color:#0284c7;text-decoration:none;">yzbconstruction.com</a>
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

    await transporter.sendMail({
      from: `"YZ Construction" <${fromAddress}>`,
      to: data.email,
      subject: `We received your inquiry - YZ Construction`,
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send client confirmation email:', error.message || error);
    return false;
  }
};

export const sendReplyToClient = async (data: ReplyEmailParams): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const fromAddress = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

    if (!transporter || !data.email) return false;

    const textContent = `
Hello ${data.name},

Thank you for your message. Here is our response:

${data.replyMessage}

Best regards,
YZ Construction, LLC
Silver Spring, MD · (240) 781-8778
https://yzbconstruction.com
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response from YZ Construction</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f5f7;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 30px;text-align:left;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                YZ Construction
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600;">
                Response to Your Inquiry
              </h2>
              <p style="margin:0 0 16px 0;font-size:14px;color:#475569;">
                Hi ${data.name},
              </p>
              <div style="background-color:#f8fafc;border-left:4px solid #0284c7;padding:16px;border-radius:0 8px 8px 0;margin:16px 0 24px 0;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${data.replyMessage}</p>
              </div>
              <p style="margin:0;font-size:13px;color:#64748b;">
                Best regards,<br>
                <strong>YZ Construction, LLC</strong><br>
                Silver Spring, MD · (240) 781-8778<br>
                <a href="https://yzbconstruction.com" style="color:#0284c7;text-decoration:none;">yzbconstruction.com</a>
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

    await transporter.sendMail({
      from: `"YZ Construction" <${fromAddress}>`,
      to: data.email,
      subject: `Response to your inquiry - YZ Construction`,
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send reply email:', error.message || error);
    return false;
  }
};

