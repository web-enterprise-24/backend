import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Transporter configuration
const transporter = nodemailer.createTransport({
  // service: "gmail",
  host: "smtp.gmail.com",
  port: 587, // Port 587 (TLS) or 465 (SSL)
  secure: false, // true for port 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"eTutoring System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html, // Content email
    });

    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
