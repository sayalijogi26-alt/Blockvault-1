const db = require("../database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const otpStore = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// ADMIN LOGIN
function loginAdmin(req, res) {

    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).send("Email and password are required.");
        return;
    }

    const sql = "SELECT * FROM users WHERE email = ? AND role = 'Admin'";

    db.query(sql, [email], function(err, results) {

        if (err) {
            console.log(err);
            res.status(500).send("Database error.");
            return;
        }

        if (results.length === 0) {
            res.status(401).send("Invalid email or password.");
            return;
        }

        const admin = results[0];

        bcrypt.compare(password, admin.password, function(err, match) {

            if (err || !match) {
                res.status(401).send("Invalid email or password.");
                return;
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            otpStore[email] = {
                otp: otp,
                expires: Date.now() + 5 * 60 * 1000
            };

            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                console.log("🔐 BLOCKVAULT ADMIN OTP:", otp);
                console.log("Valid for 5 minutes for:", email);
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                res.send("OTP sent successfully. (Dev OTP: " + otp + ")");
                return;
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "BlockVault Admin Login OTP",
                text: "Your BlockVault OTP is " + otp + ". It is valid for 5 minutes."
            };

            transporter.sendMail(mailOptions, function(mailErr) {

                if (mailErr) {
                    console.log("OTP email error:", mailErr.message);
                    console.log("🔐 FALLBACK OTP:", otp);
                    res.send("OTP sent successfully. (Fallback OTP: " + otp + ")");
                    return;
                }

                res.send("OTP sent successfully.");
            });
        });
    });
}


// VERIFY OTP
function verifyOTP(req, res) {

    const { email, otp } = req.body;

    const stored = otpStore[email];

    if (!stored) {
        res.status(401).send("OTP not found. Please login again.");
        return;
    }

    if (Date.now() > stored.expires) {
        delete otpStore[email];
        res.status(401).send("OTP expired. Please login again.");
        return;
    }

    if (otp !== stored.otp) {
        res.status(401).send("Invalid OTP.");
        return;
    }

    delete otpStore[email];

    const token = jwt.sign(
        {
            email: email,
            role: "Admin"
        },
        process.env.JWT_SECRET || "blockvault_secret",
        {
            expiresIn: "1h"
        }
    );

    res.json({
        message: "Login successful.",
        token: token
    });
}

module.exports = {
    loginAdmin,
    verifyOTP
};