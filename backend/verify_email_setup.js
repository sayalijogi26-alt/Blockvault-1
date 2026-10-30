const nodemailer = require("nodemailer");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function verifyEmailConfig() {
  console.log("=========================================");
  console.log("🔍 BlockVault Email Configuration Check");
  console.log("=========================================");
  console.log("Recipient (SUPPORT_EMAIL):", process.env.SUPPORT_EMAIL || "blockvault0926@gmail.com");
  console.log("Sender User (EMAIL_USER):", process.env.EMAIL_USER || "(not set)");
  console.log("Password Set:", process.env.EMAIL_PASSWORD ? "Yes (length: " + process.env.EMAIL_PASSWORD.trim().length + ")" : "No");
  console.log("Resend API Key Set:", process.env.RESEND_API_KEY ? "Yes" : "No");
  console.log("-----------------------------------------");

  // 1. Check Gmail SMTP
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, "") : null;

  if (user && pass) {
    console.log("Testing Gmail SMTP connection with", user, "...");
    const isLikelyAccountPassword = pass.length !== 16 || /[0-9!@#$%^&*()]/.test(pass);
    if (isLikelyAccountPassword) {
      console.warn("⚠️  WARNING: EMAIL_PASSWORD does not look like a 16-letter Google App Password.");
      console.warn("   Google SMTP requires an App Password from https://myaccount.google.com/apppasswords");
      console.warn("   Your regular Gmail login password (like 'Pass@123') will be rejected by Google with error 535.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: user.trim(), pass },
    });

    try {
      await transporter.verify();
      console.log("✅ Gmail SMTP connection: SUCCESS! Real App Password verified.");
    } catch (err) {
      console.error("❌ Gmail SMTP connection FAILED:", err.message);
    }
  } else {
    console.log("ℹ️  Gmail SMTP not fully configured in local .env.");
  }

  console.log("=========================================");
}

verifyEmailConfig();
