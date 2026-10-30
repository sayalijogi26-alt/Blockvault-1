# 🎓 BlockVault — Student & Teacher Project Guide

> **Project Name:** BlockVault — Blockchain-Based Academic Certificate Verification System  
> **Institution:** Government Polytechnic Amravati  
> **Tech Stack:** React 19, Tailwind CSS, Node.js, Express, PDFKit, QRCode, SHA-256 Cryptography, Immutable Blockchain Ledger, Nodemailer.

---

## 📌 1. Project Overview (For Viva / Teacher Explanation)

BlockVault solves certificate forgery and credential fraud in academic institutions.
Traditional paper certificates can be duplicated or altered. BlockVault provides:
1. **Cryptographic Fingerprinting (SHA-256):** Every issued certificate PDF is converted into a unique 64-character hash digest. Any change to a student's name, grade, or marks changes this hash completely.
2. **Blockchain Immutability:** The certificate hash, student details, and timestamp are anchored into a linked cryptographic block. Blocks cannot be rewritten without invalidating the chain.
3. **Instant QR Verification:** Every certificate features a verification QR code. Anyone (employer, university, student) can scan the QR code with a camera or phone to instantly verify legitimacy against the blockchain ledger.
4. **Institutional Communication:** A functional contact and support desk that dispatches real emails to college authorities.

---

## 🏗️ 2. Module Breakdown (How to Explain Each Member's Part)

### 🔹 Module 1: Cryptographic Hash & Blockchain Ledger
- **Key Concepts:** SHA-256 hashing, Genesis Block, Block Hashing, Proof-of-Sequence, Chain Validation.
- **Backend Files:**
  - `backend/blockchain/Block.js`: Defines a single block containing `index`, `timestamp`, `data` (certificate ID, student name, PDF hash), `previousHash`, and `hash`.
  - `backend/blockchain/Blockchain.js`: Manages the chain, generates Genesis Block (Block #0), mines new blocks, and validates chain integrity (`isChainValid()`).
  - `backend/routes/blockchainRoutes.js`: Exposes `GET /api/blockchain` and `GET /api/blockchain/validate`.
- **Frontend Integration:**
  - `blockvault-frontend/src/pages/admin/BlockchainViewer.js`: Visualizes every block in the ledger, shows previous hashes, and performs real-time cryptographic validation.

---

### 🔹 Module 2: Authentication & Contact Support Desk
- **Key Concepts:** Secure role-based administrative access, SMTP email routing via Nodemailer.
- **Backend Files:**
  - `backend/routes/contactRoutes.js`: Dispatches inquiries directly to `blockvaultsupport9@gmail.com` via Resend API and Gmail SMTP.
- **Frontend Integration:**
  - `blockvault-frontend/src/pages/Contact.js`: Form handles Name, Email, Subject, and Inquiry Message. Calls `POST /api/contact` with loading spinner and success modal.

---

### 🔹 Module 3: Certificate Generation & QR Encoding
- **Key Concepts:** Automated PDF generation with PDFKit, vector QR code rendering.
- **Backend Files:**
  - `backend/services/pdfService.js`: Generates official landscape A4 certificates with GP Amravati header, institutional logo, HoD & Principal signatures, and embedded verification QR code.
  - `backend/services/qrService.js`: Encodes the verification link into PNG and DataURL formats.
  - `backend/services/certificateService.js`: Coordinates PDF generation -> SHA-256 computation -> Blockchain block creation -> JSON metadata persistence.
- **Frontend Integration:**
  - `blockvault-frontend/src/pages/admin/CertificatesManagement.js`:
    - Issue Certificate modal: Input student name, roll number, course, department, institution, and grade.
    - View Certificate modal: Embedded PDF iframe viewer to inspect the authentic generated document, plus cryptographic metadata tab.

---

### 🔹 Module 4: Verification Portal, Analytics & Notifications
- **Key Concepts:** Camera-based QR scanning via `jsqr`, drag-and-drop QR verification, tamper detection, dynamic reporting.
- **Backend Files:**
  - `backend/routes/certificateRoutes.js`: Handles `POST /api/certificates/verify-qr` and `GET /api/certificates/:id`.
  - `backend/routes/analyticsRoutes.js`: Supplies live statistics (total issued, valid, revoked, verification rate).
  - `backend/routes/notificationRoutes.js`: Supplies notifications for certificate issuances, blockchain mining, and system health.
- **Frontend Integration:**
  - `blockvault-frontend/src/pages/VerifyCertificate.js`: 3 verification methods:
    1. **Scan QR Code:** Live webcam / device camera scanning with `jsqr`, image file upload, or text/URL paste.
    2. **Certificate ID:** Direct lookup by ID (e.g. `BV-2026-2293B257`).
    3. **Upload PDF:** SHA-256 document tamper checking.
  - `blockvault-frontend/src/pages/VerificationResult.js`: Displays verified student details, institution, issue date, SHA-256 fingerprint, block number, and download link.
  - `blockvault-frontend/src/pages/admin/Notifications.js`: Notification dashboard with filters, mark-as-read, and deletion.

---

## 🚀 3. Summary of Issues Resolved

| Issue Reported by User | Root Cause | Solution Implemented |
|---|---|---|
| **Contact message not sending email** | `Contact.js` had only local state `setSubmitted(true)` without backend endpoint. | Installed `nodemailer`, created `POST /api/contact` using authenticated Gmail SMTP, and connected the frontend form. |
| **Certificates not generated properly in Admin frontend** | View modal only showed a generic HTML card instead of the PDFKit landscape certificate generated in Module 3. | Added dual-tab View modal in `CertificatesManagement.js` with an embedded PDF iframe viewer (`previewTab = 'pdf'`), institution input, and auto-preview on issue. |
| **QR scan error instead of showing certificate** | No QR decoding library on frontend; previous certificates had stale Wi-Fi IP `10.149.73.215`. | Installed `jsqr`, added multi-format parsing (raw ID, URLs, query params, JSON) in both backend and frontend, added `/verify/:certificateId` route, and used dynamic LAN IP (`192.168.1.4`). |
| **Notification menu showing error** | Missing `useEffect` and `apiService` imports crashed React; backend lacked `/api/notifications` route. | Fixed imports in `Notifications.js`, created `backend/routes/notificationRoutes.js`, and tested with live data. |

---

## 💡 4. Quick Viva / Teacher Q&A Cheat Sheet

1. **Q: How does the verification prove a certificate is authentic?**  
   *A:* When the certificate is issued, a SHA-256 hash of the generated PDF is calculated and recorded permanently on our blockchain. When a verifier scans the QR code or enters the Certificate ID, the system looks up the record on the blockchain. If a student tries to modify their marks or grade on the PDF, the SHA-256 hash changes completely, causing an instant tamper alert.

2. **Q: What happens if an institution revokes a certificate?**  
   *A:* The admin clicks "Revoke" in the Certificates Management panel. A new revocation transaction is mined into the blockchain ledger. Any future verification attempt immediately shows that the certificate is Invalid/Revoked with the specific reason.

3. **Q: Why use a QR Code on the certificate?**  
   *A:* The QR code contains the direct cryptographic verification URL. Any standard smartphone or our built-in camera scanner reads the QR code and navigates to the verification engine without requiring manual typing of long certificate IDs.
