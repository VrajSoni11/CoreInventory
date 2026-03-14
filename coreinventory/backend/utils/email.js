const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, name, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"CoreInventory" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP - CoreInventory',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 32px 40px; text-align: center;">
          <h1 style="color: #e8c547; margin: 0; font-size: 24px; letter-spacing: 2px;">CORE<span style="color: #fff;">INVENTORY</span></h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Use the OTP below:</p>
          <div style="background: #1a1a2e; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #e8c547;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px;">This OTP expires in <strong>${process.env.OTP_EXPIRE_MINUTES || 10} minutes</strong>.</p>
          <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px; text-align: center;">CoreInventory — Inventory Management System</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
