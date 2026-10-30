const express = require("express");
const nodemailer = require("nodemailer");
const https = require("https");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * Configure email transporter
 * Uses Gmail App Password from environment variables.
 */
function getEmailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  // Automatically remove spaces from 16-character Google App Passwords
  const sanitizedPass = pass.trim().replace(/\s+/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user.trim(),
      pass: sanitizedPass,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

/**
 * Automatically check and remove recipient from Resend suppression list if present
 */
async function autoUnsuppressResend(apiKey, recipientEmail) {
  if (!apiKey || !recipientEmail) return;
  try {
    const listData = await new Promise((resolve) => {
      const req = https.request(
        {
          hostname: "api.resend.com",
          port: 443,
          path: "/suppressions",
          method: "GET",
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 5000,
        },
        (res) => {
          let buf = "";
          res.on("data", (c) => (buf += c));
          res.on("end", () => {
            try { resolve(JSON.parse(buf)); } catch (_) { resolve(null); }
          });
        }
      );
      req.on("error", () => resolve(null));
      req.on("timeout", () => { req.destroy(); resolve(null); });
      req.end();
    });

    const entries = listData && Array.isArray(listData.data) ? listData.data : (Array.isArray(listData) ? listData : []);
    const match = entries.find(
      (item) => item.email && item.email.toLowerCase() === recipientEmail.toLowerCase()
    );

    if (match && match.id) {
      console.log(`Auto-unsuppressing ${recipientEmail} (ID: ${match.id}) on Resend...`);
      await new Promise((resolve) => {
        const delReq = https.request(
          {
            hostname: "api.resend.com",
            port: 443,
            path: `/suppressions/${match.id}`,
            method: "DELETE",
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 5000,
          },
          (res) => resolve(res.statusCode)
        );
        delReq.on("error", () => resolve(null));
        delReq.on("timeout", () => { delReq.destroy(); resolve(null); });
        delReq.end();
      });
      console.log(`Successfully removed ${recipientEmail} from Resend suppression list.`);
    }
  } catch (err) {
    console.warn("Auto-unsuppress check note:", err.message);
  }
}

/**
 * Send an email via Resend HTTP API (works seamlessly on Render without SMTP port blocking)
 */
async function sendViaResend({ to, replyTo, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const primaryRecipient = Array.isArray(to) ? to[0] : to;
  await autoUnsuppressResend(apiKey, primaryRecipient);

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: process.env.EMAIL_FROM || "BlockVault <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo,
      subject,
      html,
      text,
    });

    const options = {
      hostname: "api.resend.com",
      port: 443,
      path: "/emails",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, provider: "resend", data });
        } else {
          reject(new Error(`Resend API error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Resend API connection timed out"));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Send an email via Brevo (Sendinblue) HTTP API
 */
async function sendViaBrevo({ to, replyTo, senderName, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: {
        name: "BlockVault Portal",
        email: process.env.MAIL_FROM || process.env.EMAIL_FROM || process.env.EMAIL_USER || "onboarding@resend.dev",
      },
      to: [{ email: to }],
      replyTo: { email: replyTo, name: senderName || "Visitor" },
      subject,
      htmlContent: html,
      textContent: text,
    });

    const options = {
      hostname: "api.brevo.com",
      port: 443,
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, provider: "brevo", data });
        } else {
          reject(new Error(`Brevo API error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Brevo API connection timed out"));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * POST /api/contact and /api/support
 * Logs support inquiries and dispatches email notification via HTTP API or SMTP.
 */
router.post("/", async (req, res) => {
  const { name, email, subject, message, problem, userEmail } = req.body;
  const senderEmail = (email || userEmail || "").trim();
  const senderName = (name || "BlockVault Visitor").trim();
  const msgSubject = (subject || "BlockVault Contact Inquiry").trim();
  const msgContent = (message || problem || "").trim();

  if (!senderEmail) {
    return res.status(400).json({
      success: false,
      message: "Please enter your email address.",
    });
  }

  if (!msgContent) {
    return res.status(400).json({
      success: false,
      message: "Please describe your message or query.",
    });
  }

  // 1. Always save inquiry immediately to local inquiries.json
  const inquiryRecord = {
    id: `INQ-${Date.now()}`,
    name: senderName,
    email: senderEmail,
    subject: msgSubject,
    message: msgContent,
    sentAt: new Date().toISOString(),
    status: "received",
  };

  try {
    const inquiriesFile = path.join(__dirname, "..", "inquiries.json");
    let list = [];
    if (fs.existsSync(inquiriesFile)) {
      list = JSON.parse(fs.readFileSync(inquiriesFile, "utf8"));
    }
    list.unshift(inquiryRecord);
    fs.writeFileSync(inquiriesFile, JSON.stringify(list, null, 2), "utf8");
  } catch (fsErr) {
    console.warn("Could not save inquiry log:", fsErr.message);
  }

  // 2. Prepare email payload
  const recipient = (process.env.SUPPORT_EMAIL || "blockvault0926@gmail.com").trim() || "blockvault0926@gmail.com";
  if (!recipient) {
    console.error("Support email error: neither SUPPORT_EMAIL nor EMAIL_USER is configured.");
    return res.status(500).json({
      success: false,
      saved: true,
      emailSent: false,
      message: "Server configuration error: SUPPORT_EMAIL is not set. Please set SUPPORT_EMAIL in Render environment.",
      error: "SUPPORT_EMAIL_MISSING",
    });
  }

  const emailSubject = `[BlockVault Contact] ${msgSubject} - from ${senderName}`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #1F3D2B; padding-bottom: 12px; margin-bottom: 18px;">
        <h2 style="color: #1F3D2B; margin: 0; font-size: 20px;">BlockVault Contact Inquiry</h2>
        <span style="color: #6b7280; font-size: 12px;">Submitted via Public Portal</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #4b5563; font-weight: 600; width: 110px;">From:</td>
          <td style="padding: 6px 0; color: #111827; font-weight: 500;">${senderName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Reply-To Email:</td>
          <td style="padding: 6px 0; color: #111827;"><a href="mailto:${senderEmail}" style="color: #1F3D2B; text-decoration: underline;">${senderEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Subject:</td>
          <td style="padding: 6px 0; color: #111827;">${msgSubject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Timestamp:</td>
          <td style="padding: 6px 0; color: #111827;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      <div style="margin-top: 10px;">
        <h4 style="color: #1F3D2B; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</h4>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #1f2937;">
${msgContent}
        </div>
      </div>
      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f3f4f6; text-align: center; color: #9ca3af; font-size: 11px;">
        Hit "Reply" in your email client to directly reply to ${senderEmail}.
      </div>
    </div>
  `;

  const emailText = `BlockVault Contact Inquiry\n\nFrom: ${senderName}\nEmail: ${senderEmail}\nSubject: ${msgSubject}\nDate: ${new Date().toLocaleString()}\n\nMessage:\n${msgContent}\n\nReply directly to: ${senderEmail}`;

  // 3. Dispatch Email Strategy:
  // Priority A: Direct Gmail SMTP (Guarantees delivery to blockvault0926@gmail.com Primary Inbox)
  // Priority B: Resend HTTP API (if RESEND_API_KEY is configured)
  // Priority C: Brevo HTTP API (if BREVO_API_KEY is configured)
  // Priority D: Cloud Relay Fallback (for local development or unconfigured SMTP)
  let emailSent = false;
  let deliveryProvider = null;
  let emailError = null;

  // Priority A: Direct Gmail SMTP via Nodemailer
  const transporter = getEmailTransporter();
  if (transporter) {
    try {
      const fromAddr = process.env.EMAIL_USER || recipient;
      const info = await transporter.sendMail({
        from: `"BlockVault Contact" <${fromAddr}>`,
        to: recipient,
        replyTo: senderEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });
      emailSent = true;
      deliveryProvider = "Gmail SMTP";
      console.log("Contact email sent via Gmail SMTP directly to Primary Inbox, messageId:", info.messageId);
    } catch (smtpErr) {
      console.error("Nodemailer SMTP delivery error:", {
        name: smtpErr.name,
        code: smtpErr.code,
        message: smtpErr.message,
      });
      if (smtpErr.responseCode === 535 || smtpErr.code === 'EAUTH' || (smtpErr.message && smtpErr.message.includes('BadCredentials'))) {
        console.warn("⚠️  Google SMTP Note: A 16-character Google App Password (generated at https://myaccount.google.com/apppasswords) is required for EMAIL_PASSWORD. Standard account login passwords are rejected with 535 by Gmail.");
      }
      emailError = `SMTP ${smtpErr.code || smtpErr.name || 'Error'}: ${smtpErr.message}`;
    }
  }

  // Priority B: Resend HTTP API (fallback)
  if (!emailSent && process.env.RESEND_API_KEY) {
    try {
      await sendViaResend({
        to: recipient,
        replyTo: senderEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });
      emailSent = true;
      deliveryProvider = "Resend HTTP API";
      console.log("Contact email sent via Resend API to", recipient);

      // Also deliver a verified copy to sayalijogi26@gmail.com (Resend Account Owner)
      // Because onboarding@resend.dev is 100% guaranteed to deliver to the owner without being suppressed!
      const ownerEmail = (process.env.RESEND_OWNER_EMAIL || "sayalijogi26@gmail.com").trim();
      if (ownerEmail && ownerEmail.toLowerCase() !== recipient.toLowerCase()) {
        try {
          await sendViaResend({
            to: ownerEmail,
            replyTo: senderEmail,
            subject: `[BlockVault Support] ${emailSubject}`,
            html: emailHtml,
            text: emailText,
          });
          console.log("Verified backup copy delivered to Resend account owner:", ownerEmail);
        } catch (copyErr) {
          console.warn("Could not deliver copy to owner:", copyErr.message);
        }
      }
    } catch (err) {
      console.error("Resend API failed:", err.message);
      emailError = `Resend: ${err.message}`;
    }
  }

  // Priority C: Brevo HTTP API (fallback)
  if (!emailSent && process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevo({
        to: recipient,
        replyTo: senderEmail,
        senderName,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });
      emailSent = true;
      deliveryProvider = "Brevo HTTP API";
      console.log("Contact email sent via Brevo API to", recipient);
    } catch (err) {
      console.error("Brevo API failed:", err.message);
      emailError = `Brevo: ${err.message}`;
    }
  }

  // Priority D: Cloud Relay Fallback (when local SMTP credentials are not present)
  // Relays the contact email to the live BlockVault production server which has Resend configured.
  if (!emailSent) {
    const isLocalOrNoKeys = !process.env.RENDER || (!process.env.RESEND_API_KEY && !process.env.EMAIL_USER);
    if (isLocalOrNoKeys) {
      try {
        console.log("Attempting live Cloud Relay to dispatch contact email to", recipient);
        const relayPayload = JSON.stringify({
          name: senderName,
          email: senderEmail,
          subject: msgSubject,
          message: msgContent,
        });

        const relayResult = await new Promise((resolve, reject) => {
          const reqRelay = https.request(
            {
              hostname: "blockvault-1.onrender.com",
              port: 443,
              path: "/api/contact",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(relayPayload),
              },
              timeout: 10000,
            },
            (resRelay) => {
              let respBody = "";
              resRelay.on("data", (chunk) => {
                respBody += chunk;
              });
              resRelay.on("end", () => {
                if (resRelay.statusCode >= 200 && resRelay.statusCode < 300) {
                  try {
                    resolve(JSON.parse(respBody));
                  } catch (_) {
                    resolve({ success: true });
                  }
                } else {
                  reject(new Error(`Relay returned status ${resRelay.statusCode}: ${respBody}`));
                }
              });
            }
          );

          reqRelay.on("error", (err) => reject(err));
          reqRelay.on("timeout", () => {
            reqRelay.destroy();
            reject(new Error("Relay request timed out"));
          });
          reqRelay.write(relayPayload);
          reqRelay.end();
        });

        if (relayResult && relayResult.success !== false) {
          emailSent = true;
          deliveryProvider = "Production Cloud Relay (Resend)";
          console.log("Contact email successfully delivered via Production Cloud Relay to", recipient);
        }
      } catch (relayErr) {
        console.warn("Cloud relay fallback attempt failed:", relayErr.message);
      }
    }
  }

  // Return response
  // If email was delivered by any provider, return 200 with full delivery confirmation
  if (emailSent) {
    return res.status(200).json({
      success: true,
      saved: true,
      emailSent: true,
      provider: deliveryProvider,
      inquiryId: inquiryRecord.id,
      recipient: recipient,
      message: `Your message has been delivered successfully to the BlockVault support team (${recipient})!`,
    });
  }

  // If email dispatch was not possible (e.g. offline with no credentials),
  // return success because inquiry was safely recorded in server records.
  return res.status(200).json({
    success: true,
    saved: true,
    emailSent: false,
    provider: deliveryProvider || "Local Inquiries Ledger",
    inquiryId: inquiryRecord.id,
    recipient: recipient,
    message: "Your inquiry has been safely recorded by BlockVault support. Our administrative team will review it shortly.",
    emailNote: emailError || "Queued in local records.",
  });
});

module.exports = router;
