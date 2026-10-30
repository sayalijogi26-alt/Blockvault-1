const nodemailer = require("nodemailer");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function verifyEmailConfig() {
  console.log("=========================================");
  console.log("🔍 BlockVault Email Configuration Check");
  console.log("=========================================");
  const recipient = process.env.SUPPORT_EMAIL || "blockvaultsupport9@gmail.com";
  console.log("Recipient (SUPPORT_EMAIL):", recipient);
  console.log("Sender User (EMAIL_USER):", process.env.EMAIL_USER || "(not set)");
  console.log("Password Set:", process.env.EMAIL_PASSWORD ? "Yes (length: " + process.env.EMAIL_PASSWORD.trim().length + ")" : "No");
  const resendKey = process.env.RESEND_API_KEY;
  console.log("Resend API Key:", resendKey ? "Present (" + resendKey.slice(0, 10) + "...)" : "No");
  console.log("-----------------------------------------");

  // 1. Check Resend API Delivery
  if (resendKey) {
    console.log("Testing Resend API delivery to", recipient, "...");
    const payload = JSON.stringify({
      from: "BlockVault <onboarding@resend.dev>",
      to: [recipient],
      subject: "BlockVault Verification Email",
      html: "<p>Live test confirming delivery to " + recipient + "</p>",
    });

    try {
      const resendRes = await new Promise((resolve, reject) => {
        const req = https.request(
          {
            hostname: "api.resend.com",
            port: 443,
            path: "/emails",
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            },
            timeout: 10000,
          },
          (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => resolve({ status: res.statusCode, data }));
          }
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
      });

      if (resendRes.status >= 200 && resendRes.status < 300) {
        console.log("✅ Resend API delivery: SUCCESS! Email ID:", JSON.parse(resendRes.data).id);
      } else {
        console.error("❌ Resend API delivery failed (" + resendRes.status + "):", resendRes.data);
      }
    } catch (err) {
      console.error("❌ Resend API connection error:", err.message);
    }
  }

  // 2. Check Gmail SMTP
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, "") : null;

  if (user && pass) {
    console.log("-----------------------------------------");
    console.log("Testing Gmail SMTP connection with", user, "...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: user.trim(), pass },
    });

    try {
      await transporter.verify();
      console.log("✅ Gmail SMTP connection: SUCCESS! App Password verified.");
    } catch (err) {
      console.log("ℹ️  Gmail SMTP Note:", err.message.slice(0, 100) + "...");
    }
  }

  console.log("=========================================");
}

verifyEmailConfig();
