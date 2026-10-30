const nodemailer = require("nodemailer");
const https = require("https");
const fs = require("fs");
const path = require("path");

function getTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return null;
    }
    const cleanPass = process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, "");
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER.trim(),
            pass: cleanPass
        }
    });
}

function sendSupportEmail(req, res) {
    const userEmail = (req.body.userEmail || req.body.email || "").trim();
    const problem = (req.body.problem || req.body.message || "").trim();
    const senderName = (req.body.name || "BlockVault User").trim();
    const problemSubject = (req.body.subject || "BlockVault Support Problem").trim();

    if (!userEmail) {
        return res.status(400).send("Please enter your email address.");
    }

    if (!problem) {
        return res.status(400).send("Please describe the problem you are facing.");
    }

    // Save inquiry locally for records
    try {
        const inquiriesPath = path.join(__dirname, "..", "inquiries.json");
        let inquiries = [];
        if (fs.existsSync(inquiriesPath)) {
            inquiries = JSON.parse(fs.readFileSync(inquiriesPath, "utf8"));
        }
        inquiries.unshift({
            id: "INQ-" + Date.now(),
            name: senderName,
            email: userEmail,
            subject: problemSubject,
            problem: problem,
            time: new Date().toISOString()
        });
        fs.writeFileSync(inquiriesPath, JSON.stringify(inquiries, null, 2), "utf8");
    } catch (saveErr) {
        console.warn("Could not save to inquiries.json:", saveErr.message);
    }

    const recipient = process.env.SUPPORT_EMAIL || "blockvaultsupport9@gmail.com";

    // 1. Try local SMTP if configured
    const transporter = getTransporter();
    if (transporter) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipient,
            replyTo: userEmail,
            subject: `[BlockVault Support] ${problemSubject}`,
            text: `User Email: ${userEmail}\nName: ${senderName}\n\nProblem:\n${problem}`
        };

        transporter.sendMail(mailOptions, function(err, info) {
            if (!err) {
                console.log("Support email sent via SMTP successfully to", recipient);
                return res.send("Problem submitted successfully! Our support team has been notified at " + recipient);
            }
            console.log("SMTP sending failed, attempting live cloud relay...", err.message);
            relayToCloud();
        });
        return;
    }

    // 2. Relay via HTTPS to live BlockVault Cloud API
    relayToCloud();

    function relayToCloud() {
        const payload = JSON.stringify({
            name: senderName,
            email: userEmail,
            subject: problemSubject,
            message: problem
        });

        const relayReq = https.request(
            {
                hostname: "blockvault-1.onrender.com",
                port: 443,
                path: "/api/contact",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload)
                },
                timeout: 10000
            },
            (relayRes) => {
                let body = "";
                relayRes.on("data", (chunk) => { body += chunk; });
                relayRes.on("end", () => {
                    console.log("Relay status:", relayRes.statusCode);
                    return res.send("Problem submitted successfully! Our support team has been notified at " + recipient);
                });
            }
        );

        relayReq.on("error", (err) => {
            console.error("Relay error:", err.message);
            // Even if network fails, the inquiry is saved locally
            return res.send("Problem submitted successfully and recorded. Our support team will review it.");
        });

        relayReq.on("timeout", () => {
            relayReq.destroy();
            return res.send("Problem submitted successfully and recorded. Our support team will review it.");
        });

        relayReq.write(payload);
        relayReq.end();
    }
}

module.exports = sendSupportEmail;