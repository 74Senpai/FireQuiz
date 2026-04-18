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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; padding: 40px 20px; color: #1e293b;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #db2777 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">FireQuiz</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin-top: 10px; font-size: 16px;">Hệ thống bài tập trực tuyến thông minh</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700;">Mã xác thực của bạn</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 24px; margin-bottom: 30px;">
            Hệ thống đã nhận được yêu cầu xác thực cho tài khoản của bạn. Vui lòng sử dụng mã dưới đây để tiếp tục. Mã này có hiệu lực trong vòng <b>5 phút</b>.
          </p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; padding: 25px; border-radius: 16px; margin-bottom: 30px;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; color: #4f46e5; letter-spacing: 12px; margin-left: 12px;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; line-height: 20px;">
            Nếu bạn không thực hiện yêu cầu này, bạn có thể an tâm bỏ qua email này. Tài khoản của bạn vẫn được bảo mật.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Đây là email tự động, vui lòng không trả lời. <br>
            &copy; 2026 FireQuiz Team. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "[FireQuiz] Mã xác thực tài khoản",
    html,
  });
};