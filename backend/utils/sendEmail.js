const nodemailer = require("nodemailer");

exports.sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Sociapi" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};