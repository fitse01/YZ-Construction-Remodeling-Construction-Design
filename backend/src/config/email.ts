import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendContactEmail = async (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) => {
  const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: ownerEmail,
    subject: `New Contact Form Submission from ${data.name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
      <hr>
      <p><em>This message was submitted via the YZ Construction website contact form.</em></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact email sent successfully');
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.ADMIN_DASHBOARD_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Password Reset Request - YZ Construction',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your YZ Construction admin account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <hr>
      <p><em>This is an automated email from YZ Construction.</em></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export default transporter;
