require("dotenv").config();

const db = require("./database");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const auth = require("./routes/auth");
const sendSupportEmail = require("./routes/support");

const app = express();

app.use(bodyParser.json());
app.use(cors());


// ADMIN LOGIN
app.post("/admin-login", function(req, res) {
    auth.loginAdmin(req, res);
});


// OTP VERIFICATION
app.post("/verify-otp", function(req, res) {
    auth.verifyOTP(req, res);
});


// SUPPORT & CONTACT
app.post(["/support", "/api/support", "/api/contact"], function(req, res) {
    console.log("SUPPORT / CONTACT ROUTE HIT:", req.body);
    sendSupportEmail(req, res);
});

// HEALTH CHECK
app.get(["/health", "/api/health"], function(req, res) {
    res.json({ success: true, message: "BlockVault VS Code Backend is online and active." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, function() {
    console.log("Server running on port " + PORT);
});