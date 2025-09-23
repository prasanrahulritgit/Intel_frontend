require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
  const { name, email, mobile, company, position, location, message } =
    req.body;

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    // let transporter = nodemailer.createTransport({
    //   host: "hotmail",
    //   auth: {
    //     user: "prasanth.selvakumar.com",  // your Outlook email
    //     pass: "lphnkfyvtdtzxjfg" // Outlook password or app password
    //   }
    // });

    let mailOptions = {
      from: `"${name}" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `
      Name: ${name}
      Email: ${email}
      Mobile: ${mobile}
      Company: ${company}
      Position: ${position}
      Location: ${location}
      Message: ${message}
    `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Run server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
