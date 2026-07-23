import nodemailer from 'nodemailer';

interface SendMessageEmailParams {
  name: string;
  email: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  message: string;
}

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendNotificationToOwner = async (data: SendMessageEmailParams) => {
  try {
    const transporter = createTransporter();
    const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER || 'info@yzconstruction.com';

    if (!transporter) {
      console.log('ℹ️ SMTP credentials not fully configured. Email log fallback:');
      console.log('New Website Message Received:', data);
      return false;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a202c; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
          🔨 New Inquiry from Website
        </h2>
        <p><strong>Client Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
        <p><strong>Project Type:</strong> ${data.projectType || 'General Inquiry'}</p>
        <p><strong>Budget:</strong> ${data.budget || 'Not specified'}</p>
        <p><strong>Timeline:</strong> ${data.timeline || 'Not specified'}</p>
        <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #2563eb; margin-top: 15px;">
          <p style="margin: 0; font-weight: bold;">Message:</p>
          <p style="margin-top: 5px; white-space: pre-wrap;">${data.message}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"YZ Construction Website" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      replyTo: data.email,
      subject: `[New Inquiry] ${data.projectType || 'Project Inquiry'} - ${data.name}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send owner email notification:', error);
    return false;
  }
};

export const sendConfirmationToClient = async (data: SendMessageEmailParams) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a202c; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
          Thank You for Contacting YZ Construction
        </h2>
        <p>Hi ${data.name},</p>
        <p>Thank you for reaching out to YZ Construction. We have received your inquiry regarding <strong>${data.projectType || 'your project'}</strong>.</p>
        <p>Our team is reviewing your message and will get back to you within 24 business hours to discuss your project details and schedule your free estimate.</p>
        <p style="margin-top: 20px;">Best regards,<br><strong>YZ Construction, LLC</strong><br>Silver Spring, MD · (240) 781-8778</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"YZ Construction, LLC" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: `We received your inquiry - YZ Construction`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send client confirmation email:', error);
    return false;
  }
};
