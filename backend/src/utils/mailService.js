import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendMail = async ({ to, subject, html }) => {

  const mailOptions = {
    from: `"FireQuiz" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

export const sendOTPEmail = async (email, otp) => {

  const html = `
    <h2>FireQuiz</h2>
    <p>Mã OTP của bạn là:</p>
    <h1>${otp}</h1>
    <p>Mã có hiệu lực trong 5 phút.</p>
  `;

  await sendMail({
    to: email,
    subject: "Reset Password OTP",
    html
  });
};