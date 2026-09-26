const nodemailer = require("nodemailer");
require("dotenv").config();
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service:"gmail",
    auth: {
      user:process.env.useremail,
      pass:process.env.pass,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "abdallaelshahat58@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err; // Re-throw the error for further handling
  }
  

};

module.exports = sendEmail;
