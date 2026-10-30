const express = require("express");
const certificateService = require("../services/certificateService");
const blockchain = require("../blockchain/Blockchain");

const router = express.Router();

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getStats() {
  const certs = certificateService.getAllCertificates();
  const validCount = certs.filter((c) => c.status === "Valid").length;
  const revokedCount = certs.filter((c) => c.status === "Invalid").length;
  const isChainValid = blockchain.isChainValid();

  // Aggregate monthly counts from blockchain blocks
  const certsMap = new Map();
  for (const block of blockchain.chain) {
    if (!block || block.index === 0 || !block.data) continue;
    const certId = block.data.certificateId || block.data.id;
    if (certId) {
      certsMap.set(certId, {
        status: block.data.status || "Valid",
        issueDate: block.data.issueDate || (block.timestamp ? new Date(block.timestamp).toISOString().split("T")[0] : null)
      });
    }
  }

  // Include any certificates stored on disk
  for (const cert of certs) {
    if (!certsMap.has(cert.id)) {
      certsMap.set(cert.id, {
        status: cert.status || "Valid",
        issueDate: cert.issueDate
      });
    }
  }

  const monthlyMap = new Map();
  for (const [certId, info] of certsMap.entries()) {
    let monthLabel = "Oct";
    let sortKey = 202610;
    if (info.issueDate && typeof info.issueDate === "string") {
      const parts = info.issueDate.split("-");
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10) || 2026;
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthLabel = monthNames[mIdx];
          sortKey = year * 100 + (mIdx + 1);
        }
      }
    }
    if (!monthlyMap.has(monthLabel)) {
      monthlyMap.set(monthLabel, {
        month: monthLabel,
        valid: 0,
        invalid: 0,
        pending: 0,
        sortKey: sortKey
      });
    }
    const m = monthlyMap.get(monthLabel);
    if (info.status === "Invalid") {
      m.invalid++;
    } else {
      m.valid++;
    }
  }

  const monthlyIssuance = Array.from(monthlyMap.values()).sort((a, b) => a.sortKey - b.sortKey);

  return {
    success: true,
    stats: {
      totalCertificates: certs.length,
      validCertificates: validCount,
      revokedCertificates: revokedCount,
      totalBlocks: blockchain.chain.length,
      isChainValid: isChainValid.valid,
      verificationRate: certs.length > 0 ? ((validCount / certs.length) * 100).toFixed(1) : "100.0"
    },
    monthlyIssuance,
    recentCertificates: certs.slice(0, 5)
  };
}

// GET /api/reports/summary, /api/reports/analytics, /api/dashboard/stats, /api/dashboard
router.get("/analytics", (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/summary", (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/stats", (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
